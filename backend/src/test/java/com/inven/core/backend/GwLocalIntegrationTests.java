package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.gwsync.cache.*;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.messaging.*;
import com.inven.core.backend.api.gwsync.service.GwQueryService;
import java.net.URI;
import java.net.http.*;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "benchmark.rows=1000",
        "gw-sync.enabled=true",
        "gw-sync.mode=local",
        "gw-sync.publish-delay-ms=100",
        "spring.kafka.bootstrap-servers=localhost:1",
        "spring.data.redis.port=1",
        "spring.datasource.url=jdbc:h2:mem:gw-local-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    }
)
class GwLocalIntegrationTests {

    @LocalServerPort
    int port;

    @Autowired
    ObjectMapper json;

    @Autowired
    GwQueryService queries;

    @Autowired
    ApplicationContext context;

    @Test
    void localModeSynchronizesCrudAndCacheWithoutKafkaOrRedis() throws Exception {
        assertTrue(context.getBeansOfType(GwEventPublisher.class).isEmpty());
        assertTrue(context.getBeansOfType(GwEventListener.class).isEmpty());
        assertTrue(context.getBeansOfType(GwSnapshotCache.class).isEmpty());
        assertInstanceOf(GwLocalSnapshotCache.class, context.getBean(GwCacheStore.class));
        var client = HttpClient.newHttpClient();
        String base = "http://localhost:" + port + "/api/gw-sync";
        var statusResponse = client.send(
            HttpRequest.newBuilder(URI.create(base + "/status"))
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        Status status = json.readValue(statusResponse.body(), Status.class);
        assertEquals("LOCAL", status.mode());
        assertEquals("MEMORY", status.cacheProvider());
        assertNull(status.topic());
        var created = write(client, base + "/items", "POST", new Input("Local GW", "v1"));
        var state = awaitRevision(created.id(), 1);
        assertEquals("LOCAL_HIT", state.cache().state());
        assertEquals("Local GW", state.cache().snapshot().name());
        write(client, base + "/items/" + created.id(), "PUT", new Input("Updated GW", "v2"));
        assertEquals("Updated GW", awaitRevision(created.id(), 2).cache().snapshot().name());
        var deletion = client.send(
            HttpRequest.newBuilder(URI.create(base + "/items/" + created.id()))
                .DELETE()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(200, deletion.statusCode());
        var deleted = awaitRevision(created.id(), 3);
        assertTrue(deleted.target().deleted());
        assertTrue(deleted.cache().snapshot().deleted());
    }

    private Source write(HttpClient client, String url, String method, Input input)
        throws Exception {
        var response = client.send(
            HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/json")
                .method(method, HttpRequest.BodyPublishers.ofString(json.writeValueAsString(input)))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(method.equals("POST") ? 201 : 200, response.statusCode(), response.body());
        return json.readValue(response.body(), Source.class);
    }

    private State awaitRevision(String id, long revision) throws Exception {
        Instant deadline = Instant.now().plusSeconds(10);
        while (Instant.now().isBefore(deadline)) {
            State state = queries.inspect(id);
            if (
                state.synchronizedData() &&
                state.source().revision() == revision &&
                state.source().publishedRevision() == revision &&
                state.cache().snapshot() != null &&
                state.cache().snapshot().revision() == revision
            ) return state;
            Thread.sleep(50);
        }
        throw new AssertionError("로컬 연동 시간 초과: " + id + " revision=" + revision);
    }
}
