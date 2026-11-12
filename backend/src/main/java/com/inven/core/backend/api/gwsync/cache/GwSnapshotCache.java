package com.inven.core.backend.api.gwsync.cache;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.*;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "gw-sync", name = "mode", havingValue = "external")
public class GwSnapshotCache implements GwCacheStore {

    private final StringRedisTemplate redis;
    private final ObjectMapper json;
    private final GwSyncProperties properties;
    // 오래된 형상이 최신 값을 덮어쓰지 않도록 버전 비교와 캐시 저장을 Lua로 원자적으로 처리합니다.
    private static final DefaultRedisScript<Long> SAVE = new DefaultRedisScript<>(
        """
        local current = redis.call('HGET', KEYS[1], 'revision')
        if not current or tonumber(ARGV[1]) >= tonumber(current) then
            redis.call('HSET', KEYS[1], 'revision', ARGV[1], 'snapshot', ARGV[2])
            redis.call('EXPIRE', KEYS[1], ARGV[3])
            return 1
        end
        return 0
        """,
        Long.class
    );

    /**
     * 대상 ID를 Redis 캐시 키로 변환합니다.
     */
    public String key(String id) {
        return "invencore:gw:target:" + id;
    }

    /**
     * 커밋 이후 캐시 저장입니다. 대상 DB 트랜잭션이 커밋된 뒤 Redis Lua로 버전 비교·형상 저장. Redis
     * 실패는 DB 반영을 되돌리지 않습니다.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterProjectionCommitted(Snapshot snapshot) {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            store(snapshot);
        } catch (RuntimeException failure) {
            log.warn(
                "GW Redis 갱신 실패 · DB는 반영됨, TTL 후 또는 다음 조회로 복구: {}",
                snapshot.id()
            );
        }
    }

    /**
     * Redis 형상과 TTL을 조회합니다. 누락 시 DB 형상을 저장하고 Redis 장애 시 DB 값으로 대체합니다.
     */
    public CacheView inspect(String id, Snapshot databaseSnapshot) {
        String cacheKey = key(id);
        if (!properties.isEnabled()) {
            return new CacheView("DISABLED", cacheKey, -1, null);
        }
        try {
            Object cached = redis.opsForHash().get(cacheKey, "snapshot");
            if (cached != null) {
                Snapshot snapshot = json.readValue(cached.toString(), Snapshot.class);
                Long ttl = redis.getExpire(cacheKey);
                return new CacheView("HIT", cacheKey, ttl == null ? -1 : ttl, snapshot);
            }
            if (databaseSnapshot == null) {
                return new CacheView("EMPTY", cacheKey, -1, null);
            }
            store(databaseSnapshot);
            return new CacheView(
                "MISS_FILLED",
                cacheKey,
                properties.getCacheTtlSeconds(),
                databaseSnapshot
            );
        } catch (RuntimeException failure) {
            return new CacheView("UNAVAILABLE_DB_FALLBACK", cacheKey, -1, databaseSnapshot);
        }
    }

    /**
     * Redis 형상 기록입니다. Lua에서 revision을 원자적으로 비교 → 이전 형상 덮어쓰기 방지 → JSON
     * 스냅샷과 TTL 저장
     */
    private void store(Snapshot snapshot) {
        redis.execute(
            SAVE,
            List.of(key(snapshot.id())),
            Long.toString(snapshot.revision()),
            json.writeValueAsString(snapshot),
            Long.toString(properties.getCacheTtlSeconds())
        );
    }
}
