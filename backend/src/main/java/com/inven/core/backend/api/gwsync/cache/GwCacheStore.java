package com.inven.core.backend.api.gwsync.cache;

import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;

public interface GwCacheStore {
    CacheView inspect(String id, Snapshot databaseSnapshot);
}
