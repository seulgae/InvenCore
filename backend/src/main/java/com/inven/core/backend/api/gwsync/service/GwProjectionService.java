package com.inven.core.backend.api.gwsync.service;

import com.inven.core.backend.api.gwsync.dto.GwSyncDto.Snapshot;
import com.inven.core.backend.api.gwsync.entity.GwTarget;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class GwProjectionService {
    private final GwSourceRepository sources;
    private final GwTargetRepository targets;
    private final ApplicationEventPublisher events;

    @Transactional
    public void project(GwChangedEvent event) {
        event.validate();
        // Source lock serializes target inserts/updates for this ID in this two-table demo.
        var source = sources.findLocked(event.id());
        if (source.isEmpty()) return; // Old Kafka events after an in-memory DB reset.
        if (event.revision() > source.get().getRevision()) throw new IllegalArgumentException("원본보다 앞선 이벤트입니다.");
        GwTarget target = targets.findById(event.id()).orElseGet(() -> GwTarget.builder().id(event.id()).build());
        if (target.getRevision() < event.revision()) {
            target.apply(event);
            targets.save(target);
        }
        // Also refresh the cache on duplicate delivery, but always from the newest target revision.
        events.publishEvent(Snapshot.from(target));
    }
}
