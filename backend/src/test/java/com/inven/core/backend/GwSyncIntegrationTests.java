package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.gwsync.cache.GwSnapshotCache;
import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.repository.GwTargetRepository;
import com.inven.core.backend.api.gwsync.service.*;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.concurrent.TimeUnit;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.kafka.core.*;
import org.springframework.kafka.test.*;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "benchmark.rows=1000",
        "gw-sync.enabled=true",
        "gw-sync.mode=external",
        "gw-sync.publish-delay-ms=100",
    }
)
@EmbeddedKafka(
    partitions = 3,
    topics = { "invencore.gw.changed.v1", "invencore.gw.changed.v1.DLT" },
    bootstrapServersProperty = "spring.kafka.bootstrap-servers"
)
@DirtiesContext
class GwSyncIntegrationTests extends PostgreSqlIntegrationTest {

    @Autowired
    GwSourceService sources;

    @Autowired
    GwTargetRepository targets;

    @Autowired
    GwSyncProperties properties;

    @Autowired
    KafkaTemplate<String, String> kafka;

    @Autowired
    ObjectMapper json;

    @Autowired
    EmbeddedKafkaBroker broker;

    @MockitoBean
    GwSnapshotCache cache;

    @LocalServerPort
    int port;

    @Test
    void publicApiSynchronizesCreateUpdateDeleteAndRejectsOldEvents() throws Exception {
        var client = HttpClient.newHttpClient();
        String base = "http://localhost:" + port + "/api/gw-sync/items";
        var createdResponse = client.send(
            HttpRequest.newBuilder(URI.create(base))
                .header("Content-Type", "application/json")
                .POST(
                    HttpRequest.BodyPublishers.ofString(
                        "{\"name\":\"Gateway\",\"description\":\"v1\"}"
                    )
                )
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(201, createdResponse.statusCode());
        Source created = json.readValue(createdResponse.body(), Source.class);
        waitForRevision(created.id(), 1);
        var oldEvent = GwChangedEvent.builder()
            .schemaVersion(1)
            .id(created.id())
            .name(created.name())
            .description(created.description())
            .revision(1)
            .deleted(false)
            .updatedAt(created.updatedAt())
            .build();
        sources.update(created.id(), new Input("Gateway updated", "v2"));
        waitForRevision(created.id(), 2);
        kafka
            .send(properties.getTopic(), created.id(), json.writeValueAsString(oldEvent))
            .get(10, TimeUnit.SECONDS);
        // Calling the same projection path deterministically checks the stale event even before listener delivery.
        projection.project(oldEvent);
        assertEquals(2, targets.findById(created.id()).orElseThrow().getRevision());
        assertEquals("Gateway updated", targets.findById(created.id()).orElseThrow().getName());
        var deletedResponse = client.send(
            HttpRequest.newBuilder(URI.create(base + "/" + created.id()))
                .DELETE()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(200, deletedResponse.statusCode());
        waitForRevision(created.id(), 3);
        assertTrue(targets.findById(created.id()).orElseThrow().isDeleted());
        projection.project(oldEvent);
        assertTrue(targets.findById(created.id()).orElseThrow().isDeleted());
        var detail = client.send(
            HttpRequest.newBuilder(URI.create(base + "/" + created.id()))
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );
        assertEquals(200, detail.statusCode());
        assertTrue(detail.body().contains("\"synchronizedData\":true"));
        assertEquals(
            404,
            client
                .send(
                    HttpRequest.newBuilder(URI.create(base + "/missing"))
                        .GET()
                        .build(),
                    HttpResponse.BodyHandlers.ofString()
                )
                .statusCode()
        );
        assertEquals(
            400,
            client
                .send(
                    HttpRequest.newBuilder(URI.create(base))
                        .header("Content-Type", "application/json")
                        .POST(
                            HttpRequest.BodyPublishers.ofString(
                                "{\"name\":\"\",\"description\":\"x\"}"
                            )
                        )
                        .build(),
                    HttpResponse.BodyHandlers.ofString()
                )
                .statusCode()
        );
    }

    @Autowired
    GwProjectionService projection;

    @Test
    void invalidEventGoesToDeadLetterTopic() throws Exception {
        String dlt = properties.getTopic() + ".DLT";
        var props = KafkaTestUtils.consumerProps(broker, "gw-dlt-test", false);
        try (
            var consumer = new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new StringDeserializer()
            ).createConsumer()
        ) {
            broker.consumeFromAnEmbeddedTopic(consumer, dlt);
            kafka
                .send(properties.getTopic(), "invalid", "{\"schemaVersion\":99}")
                .get(10, TimeUnit.SECONDS);
            var record = KafkaTestUtils.getSingleRecord(consumer, dlt, Duration.ofSeconds(20));
            assertEquals("{\"schemaVersion\":99}", record.value());
        }
    }

    private void waitForRevision(String id, long revision) throws Exception {
        Instant deadline = Instant.now().plusSeconds(20);
        while (Instant.now().isBefore(deadline)) {
            if (
                targets
                    .findById(id)
                    .map(t -> t.getRevision() == revision)
                    .orElse(false)
            ) return;
            Thread.sleep(100);
        }
        fail("Kafka 대상 테이블 연동 시간 초과: " + id + " revision=" + revision);
    }
}
