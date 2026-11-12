package com.inven.core.backend;

import com.inven.core.backend.api.gwsync.cache.GwSnapshotCache;
import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.Snapshot;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.*;
import tools.jackson.databind.json.JsonMapper;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GwSnapshotCacheTests {
    @Test void readsTypedJsonAndFallsBackWhenRedisFails() {
        var redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked") HashOperations<String, Object, Object> hash = mock(HashOperations.class);
        when(redis.opsForHash()).thenReturn(hash);
        var json = JsonMapper.builder().findAndAddModules().build();
        var properties = new GwSyncProperties();
        properties.setEnabled(true);
        var cache = new GwSnapshotCache(redis, json, properties);
        var snapshot = Snapshot.builder().id("test-id").name("gw").description("shape").revision(2)
                .sourceUpdatedAt(Instant.now()).syncedAt(Instant.now()).build();
        when(hash.get(cache.key(snapshot.id()), "snapshot")).thenReturn(json.writeValueAsString(snapshot));
        when(redis.getExpire(cache.key(snapshot.id()))).thenReturn(40L);
        assertEquals("HIT", cache.inspect(snapshot.id(), null).state());
        assertEquals(snapshot, cache.inspect(snapshot.id(), null).snapshot());
        when(hash.get(cache.key(snapshot.id()), "snapshot")).thenThrow(new RedisConnectionFailureException("offline"));
        var fallback = cache.inspect(snapshot.id(), snapshot);
        assertEquals("UNAVAILABLE_DB_FALLBACK", fallback.state());
        assertEquals(snapshot, fallback.snapshot());
    }
}
