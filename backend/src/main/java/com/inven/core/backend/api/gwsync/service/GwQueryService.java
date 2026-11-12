package com.inven.core.backend.api.gwsync.service;

import com.inven.core.backend.api.gwsync.cache.GwCacheStore;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GwQueryService {

    private final GwSourceRepository sources;
    private final GwTargetRepository targets;
    private final GwCacheStore cache;

    /**
     * 원본·대상 DB 상태와 캐시 형상을 함께 조회해 연동 상태를 비교합니다.
     */
    @Transactional(readOnly = true)
    public State inspect(String id) {
        Source source = Source.from(
            sources
                .findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "원본을 찾을 수 없습니다.")
                )
        );
        Snapshot target = targets.findById(id).map(Snapshot::from).orElse(null);
        return new State(
            source,
            target,
            cache.inspect(id, target),
            target != null && source.revision() == target.revision()
        );
    }
}
