package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/** Docker 앞단의 localhost:8081 Origin과 백엔드의 CORS 처리 계약을 검사합니다. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "gw-sync.enabled=false",
        "benchmark.rows=1000",
        "spring.datasource.url=jdbc:h2:mem:member-cors;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
class MemberCorsTests {

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newHttpClient();

    /** 허용된 Docker 프론트 Origin의 가입 POST가 실제 회원 서비스까지 도달하는지 확인합니다. */
    @Test
    void dockerFrontendCanRegister() throws Exception {
        var response = client.send(
            HttpRequest.newBuilder(registerUri())
                .header("Origin", "http://localhost:8081")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                    "{\"username\":\"CorsDemoUser\",\"password\":\"CorsTest2026!\"}"
                ))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(201, response.statusCode(), response.body());
        assertEquals("http://localhost:8081", response.headers()
            .firstValue("Access-Control-Allow-Origin").orElseThrow());
        assertTrue(response.body().contains("\"success\":true"));
    }

    /** 등록 API의 사전 요청에도 허용 Origin과 POST 메서드가 응답되는지 확인합니다. */
    @Test
    void dockerFrontendPreflightIsAllowed() throws Exception {
        for (String origin : new String[] { "http://localhost:8081", "http://127.0.0.1:8081" }) {
            var response = client.send(
                HttpRequest.newBuilder(registerUri())
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type")
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                    .build(),
                HttpResponse.BodyHandlers.ofString()
            );
            assertEquals(200, response.statusCode(), response.body());
            assertEquals(origin, response.headers()
                .firstValue("Access-Control-Allow-Origin").orElseThrow());
            assertTrue(response.headers().firstValue("Access-Control-Allow-Methods")
                .orElseThrow().contains("POST"));
        }
    }

    /** 등록 경로가 공개되어 있어도 허용 목록 밖의 Origin은 거부해야 합니다. */
    @Test
    void unlistedOriginIsRejected() throws Exception {
        var response = client.send(
            HttpRequest.newBuilder(registerUri())
                .header("Origin", "https://unlisted.example")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(403, response.statusCode());
        assertEquals("Invalid CORS request", response.body());
        assertTrue(response.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
    }

    private URI registerUri() {
        return URI.create("http://localhost:" + port + "/api/members/register");
    }
}
