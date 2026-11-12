package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "gw-sync.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:auth-regression;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
class RequestBoardAuthenticationTests {

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void disabledGwSyncReportsConfigurationAndRejectsWritesWithoutExternalServices()
        throws Exception {
        String base = "http://localhost:" + port + "/api/gw-sync";
        var status = client.send(
            HttpRequest.newBuilder(URI.create(base + "/status"))
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(200, status.statusCode());
        assertTrue(status.body().contains("\"enabled\":false"));
        var create = client.send(
            HttpRequest.newBuilder(URI.create(base + "/items"))
                .header("Content-Type", "application/json")
                .POST(
                    HttpRequest.BodyPublishers.ofString(
                        "{\"name\":\"disabled\",\"description\":\"test\"}"
                    )
                )
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(503, create.statusCode());
    }

    @Test
    void otherEndpointsStillRequireAuthentication() throws Exception {
        for (String token : new String[] { "", "invalid-token" }) {
            var builder = HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/api/private-example")
            ).GET();
            if (!token.isEmpty()) builder.header("Authorization", "Bearer " + token);
            var response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(401, response.statusCode());
            assertTrue(response.body().contains("AUTHENTICATION_REQUIRED"));
        }
    }

    @Test
    void anonymousCanCreateUpdateAndDeleteMultipartBoard() throws Exception {
        String boundary = "InvenCoreRegressionBoundary";
        String body =
            "--" +
            boundary +
            "\r\nContent-Disposition: form-data; name=\"requestBoardDTO\"\r\nContent-Type: application/json\r\n\r\n{\"title\":\"auth regression\",\"content\":\"multipart request\"}\r\n--" +
            boundary +
            "--\r\n";
        var request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/api/requestboards")
        )
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, response.statusCode(), response.body());
        assertTrue(response.body().contains("auth regression"));
        assertTrue(response.body().contains("demo"));
        var idMatcher = java.util.regex.Pattern.compile("\"id\":(\\d+)").matcher(response.body());
        assertTrue(idMatcher.find());
        String id = idMatcher.group(1);
        var update = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/api/requestboards/" + id)
        )
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .PUT(HttpRequest.BodyPublishers.ofString(body))
            .build();
        assertEquals(200, client.send(update, HttpResponse.BodyHandlers.ofString()).statusCode());
        var delete = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/api/requestboards/" + id)
        )
            .DELETE()
            .build();
        assertEquals(204, client.send(delete, HttpResponse.BodyHandlers.ofString()).statusCode());
    }

    @Test
    void anonymousCanUseCommentCrud() throws Exception {
        for (String resource : new String[] { "comments" }) {
            String json = "{\"requestBoardId\":1,\"content\":\"demo comment\"}";
            URI collection = URI.create("http://localhost:" + port + "/api/" + resource);
            var create = HttpRequest.newBuilder(collection)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
            var response = client.send(create, HttpResponse.BodyHandlers.ofString());
            assertEquals(201, response.statusCode(), response.body());
            assertTrue(response.body().contains("demo"));
            var matcher = java.util.regex.Pattern.compile("\"id\":(\\d+)").matcher(response.body());
            assertTrue(matcher.find());
            URI detail = URI.create(collection + "/" + matcher.group(1));
            var update = HttpRequest.newBuilder(detail)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(json))
                .build();
            assertEquals(
                200,
                client.send(update, HttpResponse.BodyHandlers.ofString()).statusCode()
            );
            assertEquals(
                204,
                client
                    .send(
                        HttpRequest.newBuilder(detail).DELETE().build(),
                        HttpResponse.BodyHandlers.ofString()
                    )
                    .statusCode()
            );
        }
    }
}
