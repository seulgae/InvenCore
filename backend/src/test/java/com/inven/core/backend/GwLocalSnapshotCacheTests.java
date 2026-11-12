package com.inven.core.backend;

import com.inven.core.backend.api.gwsync.cache.GwLocalSnapshotCache;
import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.Snapshot;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GwLocalSnapshotCacheTests {
    @Test void cachePreservesNewerDeletionAndExpiresWithConfiguredTtl() {
        Clock clock = mock(Clock.class);
        Instant now = Instant.parse("2026-11-12T00:00:00Z");
        when(clock.instant()).thenReturn(now);
        var properties = new GwSyncProperties();
        properties.setCacheTtlSeconds(60);
        var cache = new GwLocalSnapshotCache(JsonMapper.builder().findAndAddModules().build(), properties, clock);
        Snapshot current = Snapshot.builder().id("local-id").name("new").description("deleted").revision(2)
                .deleted(true).sourceUpdatedAt(now).syncedAt(now).build();
        Snapshot stale = Snapshot.builder().id("local-id").name("old").description("v1").revision(1)
                .sourceUpdatedAt(now).syncedAt(now).build();
        cache.cacheLocalSnapshot(current);
        cache.cacheLocalSnapshot(stale);
        assertEquals(current, cache.inspect(current.id(), null).snapshot());
        assertEquals(60, cache.inspect(current.id(), null).ttlSeconds());
        when(clock.instant()).thenReturn(now.plusSeconds(61));
        assertEquals("LOCAL_EMPTY", cache.inspect(current.id(), null).state());
        assertEquals("LOCAL_MISS_FILLED", cache.inspect(current.id(), current).state());
        assertEquals(current, cache.inspect(current.id(), null).snapshot());
    }
}
