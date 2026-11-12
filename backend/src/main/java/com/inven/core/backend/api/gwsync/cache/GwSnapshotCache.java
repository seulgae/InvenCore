package com.inven.core.backend.api.gwsync.cache;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.event.*;
import tools.jackson.databind.ObjectMapper;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
@ConditionalOnProperty(prefix = "gw-sync", name = "mode", havingValue = "external")
public class GwSnapshotCache implements GwCacheStore {
    private final StringRedisTemplate redis;
    private final ObjectMapper json;
    private final GwSyncProperties properties;
    // Compare and write atomically so an older cache fill cannot overwrite a newer projection.
    private static final DefaultRedisScript<Long> SAVE = new DefaultRedisScript<>("""
            local current = redis.call('HGET', KEYS[1], 'revision')
            if not current or tonumber(ARGV[1]) >= tonumber(current) then
                redis.call('HSET', KEYS[1], 'revision', ARGV[1], 'snapshot', ARGV[2])
                redis.call('EXPIRE', KEYS[1], ARGV[3])
                return 1
            end
            return 0
            """, Long.class);

    public String key(String id) { return "invencore:gw:target:" + id; }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterProjectionCommitted(Snapshot snapshot) {
        if (!properties.isEnabled()) return;
        try { store(snapshot); }
        catch (RuntimeException failure) { log.warn("GW Redis 갱신 실패 · DB는 반영됨, TTL 후 또는 다음 조회로 복구: {}", snapshot.id()); }
    }

    public CacheView inspect(String id, Snapshot databaseSnapshot) {
        String cacheKey = key(id);
        if (!properties.isEnabled()) return new CacheView("DISABLED", cacheKey, -1, null);
        try {
            Object cached = redis.opsForHash().get(cacheKey, "snapshot");
            if (cached != null) {
                Snapshot snapshot = json.readValue(cached.toString(), Snapshot.class);
                Long ttl = redis.getExpire(cacheKey);
                return new CacheView("HIT", cacheKey, ttl == null ? -1 : ttl, snapshot);
            }
            if (databaseSnapshot == null) return new CacheView("EMPTY", cacheKey, -1, null);
            store(databaseSnapshot);
            return new CacheView("MISS_FILLED", cacheKey, properties.getCacheTtlSeconds(), databaseSnapshot);
        } catch (RuntimeException failure) {
            return new CacheView("UNAVAILABLE_DB_FALLBACK", cacheKey, -1, databaseSnapshot);
        }
    }

    private void store(Snapshot snapshot) {
        redis.execute(SAVE, List.of(key(snapshot.id())), Long.toString(snapshot.revision()),
                json.writeValueAsString(snapshot), Long.toString(properties.getCacheTtlSeconds()));
    }
}
