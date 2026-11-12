package com.inven.core.backend.api.gwsync.cache;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.*;
import tools.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.concurrent.ConcurrentHashMap;

@Service @RequiredArgsConstructor
@ConditionalOnProperty(prefix = "gw-sync", name = "mode", havingValue = "local", matchIfMissing = true)
public class GwLocalSnapshotCache implements GwCacheStore {
    private record Entry(long revision, String json, Instant expiresAt) {}
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();
    private final ObjectMapper json;
    private final GwSyncProperties properties;
    private final Clock clock;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void cacheLocalSnapshot(Snapshot snapshot) {
        if (properties.isEnabled()) saveLocalSnapshot(snapshot);
    }

    private void saveLocalSnapshot(Snapshot snapshot) {
        Instant now = clock.instant();
        entries.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        String serialized = json.writeValueAsString(snapshot);
        entries.compute(snapshot.id(), (id, current) -> current == null || snapshot.revision() >= current.revision()
                ? new Entry(snapshot.revision(), serialized, now.plusSeconds(properties.getCacheTtlSeconds())) : current);
    }

    @Override
    public CacheView inspect(String id, Snapshot databaseSnapshot) {
        String key = "invencore:gw:local-target:" + id;
        if (!properties.isEnabled()) return new CacheView("DISABLED", key, -1, null);
        Instant now = clock.instant();
        Entry entry = entries.computeIfPresent(id, (ignored, current) -> current.expiresAt().isAfter(now) ? current : null);
        if (entry != null) return new CacheView("LOCAL_HIT", key,
                Math.max(0, Duration.between(now, entry.expiresAt()).getSeconds()), json.readValue(entry.json(), Snapshot.class));
        if (databaseSnapshot == null) return new CacheView("LOCAL_EMPTY", key, -1, null);
        saveLocalSnapshot(databaseSnapshot);
        return new CacheView("LOCAL_MISS_FILLED", key, properties.getCacheTtlSeconds(), databaseSnapshot);
    }
}
