package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/** Funnel Origin과 신뢰하지 않는 프록시 헤더에 대한 실제 HTTP 보안 계약입니다. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "gw-sync.enabled=false",
        "benchmark.rows=1000",
        "spring.datasource.url=jdbc:h2:mem:member-https-cors;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
class MemberHttpsCorsTests {

    private static final String HTTPS_ORIGIN = "https://seulgae-server.tailac4b36.ts.net";
    private static final String[] ORIGINS = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        HTTPS_ORIGIN,
    };

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newHttpClient();

    /** HTTPS와 기존 Docker 주소에서 토큰 없이 가입하고 실제 로그인할 수 있어야 합니다. */
    @Test
    void allowedOriginsCanRegisterAndLogin() throws Exception {
        for (String origin : new String[] { ORIGINS[4], ORIGINS[6], HTTPS_ORIGIN }) {
            String username =
                "Cors" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            String password = UUID.randomUUID().toString().substring(0, 12) + "aA1!";
            String credentials =
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
            var registered = post("/api/members/register", origin, credentials);
            assertEquals(201, registered.statusCode());
            assertAllowedOrigin(registered, origin);
            var loggedIn = post("/api/members/login", origin, credentials);
            assertEquals(200, loggedIn.statusCode());
            assertAllowedOrigin(loggedIn, origin);
            assertTrue(loggedIn.body().contains("\"success\":true"));
            // 토큰은 발급 여부만 확인하고 값·비밀번호는 출력하지 않습니다.
            assertTrue(loggedIn.body().matches("(?s).*\"token\":\"[^\"]+\".*"));
        }
    }

    /** 기존 개발 주소와 HTTPS 주소의 가입·로그인 사전 요청을 허용합니다. */
    @Test
    void allowedOriginsCanPreflightBothPublicEndpoints() throws Exception {
        for (String origin : ORIGINS) {
            for (String endpoint : new String[] { "/api/members/register", "/api/members/login" }) {
                var response = client.send(
                    HttpRequest.newBuilder(uri(endpoint))
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type")
                        .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                        .build(),
                    HttpResponse.BodyHandlers.ofString()
                );
                assertEquals(200, response.statusCode(), origin + " / " + endpoint);
                assertAllowedOrigin(response, origin);
                assertTrue(
                    response
                        .headers()
                        .firstValue("Access-Control-Allow-Methods")
                        .orElseThrow()
                        .contains("POST")
                );
            }
        }
    }

    /** 잘못된 로그인 정보는 CORS 403 대신 인증 실패 401로 처리합니다. */
    @Test
    void invalidLoginFromHttpsReturnsUnauthorized() throws Exception {
        var response = post(
            "/api/members/login",
            HTTPS_ORIGIN,
            "{\"username\":\"MissingCorsUser\",\"password\":\"\"}"
        );
        assertEquals(401, response.statusCode());
        assertAllowedOrigin(response, HTTPS_ORIGIN);
    }

    /** 공개 경로라도 미허용 Origin과 사전 요청은 계속 차단해야 합니다. */
    @Test
    void unlistedOriginsRemainForbidden() throws Exception {
        for (String origin : new String[] {
            "https://unlisted.example",
            "https://seulgae-server.tailac4b36.ts.net.evil.example",
        }) {
            for (String endpoint : new String[] { "/api/members/register", "/api/members/login" }) {
                var response = post(endpoint, origin, "{}");
                assertEquals(403, response.statusCode());
                assertEquals("Invalid CORS request", response.body());
                assertTrue(response.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
                var preflight = client.send(
                    HttpRequest.newBuilder(uri(endpoint))
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "POST")
                        .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                        .build(),
                    HttpResponse.BodyHandlers.ofString()
                );
                assertEquals(403, preflight.statusCode());
            }
        }
    }

    /** Forwarded를 위조해 같은 Origin으로 보이게 해도 CORS를 우회할 수 없습니다. */
    @Test
    void spoofedForwardedHeadersDoNotBypassCors() throws Exception {
        var response = client.send(
            HttpRequest.newBuilder(uri("/api/members/login"))
                .header("Origin", "https://unlisted.example")
                .header("Forwarded", "proto=https;host=unlisted.example")
                .header("X-Forwarded-Host", "unlisted.example")
                .header("X-Forwarded-Proto", "https")
                .header("X-Forwarded-Port", "443")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(403, response.statusCode());
        assertEquals("Invalid CORS request", response.body());
    }

    /** HTTPS 허용이 다른 API의 인증 요구를 제거하지 않는지 검사합니다. */
    @Test
    void httpsOriginDoesNotGrantAccessToProtectedApis() throws Exception {
        var response = client.send(
            HttpRequest.newBuilder(uri("/api/private-example"))
                .header("Origin", HTTPS_ORIGIN)
                .header("X-Forwarded-Proto", "https")
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(401, response.statusCode());
        assertAllowedOrigin(response, HTTPS_ORIGIN);
    }

    /** 비밀값을 로그에 남기지 않고 테스트 요청을 전송합니다. */
    private HttpResponse<String> post(String path, String origin, String body) throws Exception {
        return client.send(
            HttpRequest.newBuilder(uri(path))
                .header("Origin", origin)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
    }

    /** 허용 응답은 와일드카드가 아니라 요청 Origin을 명시합니다. */
    private void assertAllowedOrigin(HttpResponse<String> response, String origin) {
        assertEquals(
            origin,
            response.headers().firstValue("Access-Control-Allow-Origin").orElseThrow()
        );
        assertEquals(
            "true",
            response.headers().firstValue("Access-Control-Allow-Credentials").orElseThrow()
        );
    }

    /** 임의 테스트 포트의 API 주소를 구성합니다. */
    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
