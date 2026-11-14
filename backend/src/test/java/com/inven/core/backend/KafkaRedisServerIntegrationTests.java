package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.gwsync.cache.*;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.messaging.*;
import com.inven.core.backend.api.gwsync.service.*;
import java.time.Duration;
import java.util.function.BooleanSupplier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;

/** PostgreSQL + real Kafka protocol + actual Redis/Lua, without cache mocks. */
@SpringBootTest(properties = {
    "gw-sync.mode=external", "gw-sync.enabled=true", "benchmark.rows=2000",
    "gw-sync.publish-delay-ms=100"
})
@EmbeddedKafka(partitions = 3, bootstrapServersProperty = "spring.kafka.bootstrap-servers")
@DirtiesContext
class KafkaRedisServerIntegrationTests extends PostgreSqlIntegrationTest {
    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:8-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void redis(DynamicPropertyRegistry registry) {
        REDIS.start();
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("spring.data.redis.username", () -> "");
        registry.add("spring.data.redis.password", () -> "");
    }

    @Autowired ApplicationContext context;
    @Autowired GwSourceService sources;
    @Autowired GwQueryService queries;
    @Autowired GwSnapshotCache cache;
    @Autowired StringRedisTemplate redis;

    @Test
    void kafkaProjectsCommittedChangesAndRedisCachesLatestRevisionWithTtl() throws Exception {
        assertTrue(context.getBeansOfType(GwLocalEventPublisher.class).isEmpty());
        assertTrue(context.getBeansOfType(GwLocalEventListener.class).isEmpty());
        assertTrue(context.getBeansOfType(GwLocalSnapshotCache.class).isEmpty());
        assertEquals(1, context.getBeansOfType(GwEventPublisher.class).size());

        var source = sources.create(new Input("server-integration", "Kafka → PostgreSQL → Redis"));
        await(() -> queries.inspect(source.id()).synchronizedData()
            && "HIT".equals(queries.inspect(source.id()).cache().state()));
        var first = queries.inspect(source.id());
        assertEquals(1, first.target().revision());
        assertTrue(first.cache().ttlSeconds() > 0);

        sources.update(source.id(), new Input("server-updated", "revision 2"));
        await(() -> {
            var state = queries.inspect(source.id());
            return state.target() != null && state.target().revision() == 2
                && state.cache().snapshot() != null && state.cache().snapshot().revision() == 2;
        });
        // An older event/cache write must not replace the latest Redis revision.
        cache.afterProjectionCommitted(first.target());
        assertEquals(2, cache.inspect(source.id(), null).snapshot().revision());

        redis.delete(cache.key(source.id()));
        var refill = queries.inspect(source.id()).cache();
        assertEquals("MISS_FILLED", refill.state());
        assertEquals(2, refill.snapshot().revision());
        assertEquals("HIT", queries.inspect(source.id()).cache().state());

        sources.delete(source.id());
        await(() -> {
            var state = queries.inspect(source.id());
            return state.target().deleted() && state.cache().snapshot() != null
                && state.cache().snapshot().deleted();
        });
    }

    private void await(BooleanSupplier condition) throws Exception {
        long deadline = System.nanoTime() + Duration.ofSeconds(20).toNanos();
        while (System.nanoTime() < deadline) {
            if (condition.getAsBoolean()) return;
            Thread.sleep(50);
        }
        fail("Kafka/PostgreSQL/Redis synchronization did not complete within 20 seconds");
    }
}
