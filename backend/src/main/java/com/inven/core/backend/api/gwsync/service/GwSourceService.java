package com.inven.core.backend.api.gwsync.service;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.entity.GwSource;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.repository.GwSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service @RequiredArgsConstructor
public class GwSourceService {
    private final GwSourceRepository sources;
    private final GwSyncProperties properties;

    @Transactional
    public Source create(Input input) {
        requireEnabled();
        return Source.from(sources.save(GwSource.builder().name(input.name()).description(input.description()).build()));
    }

    @Transactional
    public Source update(String id, Input input) {
        requireEnabled();
        GwSource source = locked(id);
        if (source.isDeleted()) throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 삭제된 원본입니다.");
        source.revise(input.name(), input.description());
        return Source.from(source);
    }

    @Transactional
    public Source delete(String id) {
        requireEnabled();
        GwSource source = locked(id);
        if (!source.isDeleted()) source.remove();
        return Source.from(source);
    }

    @Transactional(readOnly = true)
    public List<Source> recent() { return sources.findTop20ByOrderByUpdatedAtDesc().stream().map(Source::from).toList(); }

    @Transactional(readOnly = true)
    public List<GwChangedEvent> pending() {
        return sources.findPending(PageRequest.of(0, 20)).stream().map(GwChangedEvent::from).toList();
    }

    @Transactional
    public void confirmPublished(String id, long revision) { locked(id).markPublished(revision); }

    private GwSource locked(String id) {
        return sources.findLocked(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "원본을 찾을 수 없습니다."));
    }
    private void requireEnabled() {
        if (!properties.isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "GW_SYNC_ENABLED=true 설정 후 서버를 재실행하세요.");
    }
}
