package com.inven.core.backend.api.gwsync.cache;

import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;

public interface GwCacheStore {
    /**
     * 캐시 상태와 TTL을 조회하고 필요한 경우 전달된 DB 형상으로 보충합니다.
     */
    CacheView inspect(String id, Snapshot databaseSnapshot);
}
