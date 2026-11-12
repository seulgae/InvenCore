package com.inven.core.backend.api.gwsync.service;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.entity.GwSource;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.repository.GwSourceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GwSourceService {

    private final GwSourceRepository sources;
    private final GwSyncProperties properties;

    /**
     * 원본 생성입니다. 설정 활성 여부 확인 → 빌더로 원본 구성 → JPA 저장. 별도 발행 스케줄러가 커밋된 대기 행을
     * 조회합니다.
     */
    @Transactional
    public Source create(Input input) {
        requireEnabled();
        return Source.from(
            sources.save(
                GwSource.builder().name(input.name()).description(input.description()).build()
            )
        );
    }

    /**
     * 원본 행을 잠근 뒤 이름·설명과 revision을 같은 트랜잭션에서 갱신합니다.
     */
    @Transactional
    public Source update(String id, Input input) {
        requireEnabled();
        GwSource source = locked(id);
        if (source.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 삭제된 원본입니다.");
        }
        source.revise(input.name(), input.description());
        return Source.from(source);
    }

    /**
     * 원본을 잠근 뒤 삭제 표시와 revision을 저장해 삭제도 이벤트로 전달합니다.
     */
    @Transactional
    public Source delete(String id) {
        requireEnabled();
        GwSource source = locked(id);
        if (!source.isDeleted()) {
            source.remove();
        }
        return Source.from(source);
    }

    /**
     * 최근 변경한 GW 원본 목록을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<Source> recent() {
        return sources.findTop20ByOrderByUpdatedAtDesc().stream().map(Source::from).toList();
    }

    /**
     * 발행 대기 조회입니다. revision > publishedRevision인 원본을 최대 20개 조회 → 변경
     * 이벤트로 매핑
     */
    @Transactional(readOnly = true)
    public List<GwChangedEvent> pending() {
        return sources
            .findPending(PageRequest.of(0, 20))
            .stream()
            .map(GwChangedEvent::from)
            .toList();
    }

    /**
     * Kafka 전송 확인입니다. 원본 행 잠금 → ack를 받은 버전까지 발행 확인
     */
    @Transactional
    public void confirmPublished(String id, long revision) {
        locked(id).markPublished(revision);
    }

    /**
     * ID에 해당하는 원본을 잠금 조회하고 없으면 404 오류를 반환합니다.
     */
    private GwSource locked(String id) {
        return sources
            .findLocked(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "원본을 찾을 수 없습니다.")
            );
    }

    /**
     * GW 기능이 비활성화된 경우 변경 요청을 거부합니다.
     */
    private void requireEnabled() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "GW_SYNC_ENABLED=true 설정 후 서버를 재실행하세요."
            );
        }
    }
}
