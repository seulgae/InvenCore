package com.inven.core.backend.api.gwsync.service;

import com.inven.core.backend.api.gwsync.dto.GwSyncDto.Snapshot;
import com.inven.core.backend.api.gwsync.entity.GwTarget;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GwProjectionService {

    private final GwSourceRepository sources;
    private final GwTargetRepository targets;
    private final ApplicationEventPublisher events;

    /**
     * 대상 형상 반영입니다. 원본 행 잠금 → 대상 revision 비교 → 더 최신 이벤트만 저장 → 캐시 갱신용 스냅샷
     * 이벤트 발행
     */
    @Transactional
    public void project(GwChangedEvent event) {
        event.validate();
        // 같은 ID의 대상 생성·갱신이 겹치지 않도록 원본 행을 잠급니다.
        var source = sources.findLocked(event.id());
        if (source.isEmpty()) {
            // 메모리 DB 초기화 전에 Kafka에 남아 있던 이벤트는 반영하지 않습니다.
            return;
        }
        if (event.revision() > source.get().getRevision()) {
            throw new IllegalArgumentException("원본보다 앞선 이벤트입니다.");
        }
        GwTarget target = targets
            .findById(event.id())
            .orElseGet(() -> GwTarget.builder().id(event.id()).build());
        if (target.getRevision() < event.revision()) {
            target.apply(event);
            targets.save(target);
        }
        // 중복 수신에도 최신 대상 형상으로 캐시를 보충합니다. 실제 저장은 DB 커밋 후 수행합니다.
        events.publishEvent(Snapshot.from(target));
    }
}
