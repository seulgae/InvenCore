package com.inven.core.backend.api.gwsync.event;

import com.inven.core.backend.api.gwsync.entity.GwSource;
import java.time.Instant;
import lombok.Builder;

@Builder
public record GwChangedEvent(
    int schemaVersion,
    String id,
    String name,
    String description,
    long revision,
    boolean deleted,
    Instant updatedAt
) {
    /**
     * 원본의 현재 revision과 삭제 상태를 전달용 변경 이벤트로 변환합니다.
     */
    public static GwChangedEvent from(GwSource source) {
        return GwChangedEvent.builder()
            .schemaVersion(1)
            .id(source.getId())
            .name(source.getName())
            .description(source.getDescription())
            .revision(source.getRevision())
            .deleted(source.isDeleted())
            .updatedAt(source.getUpdatedAt())
            .build();
    }

    /**
     * 연동 이벤트 검증입니다. 스키마 버전·ID·revision·이름·설명 길이·변경 시각 검사
     */
    public void validate() {
        if (
            schemaVersion != 1 ||
            id == null ||
            !id.matches("[0-9a-fA-F-]{36}") ||
            revision < 1 ||
            name == null ||
            name.isBlank() ||
            name.length() > 100 ||
            description == null ||
            description.length() > 2000 ||
            updatedAt == null
        ) {
            throw new IllegalArgumentException("유효하지 않은 GW 이벤트입니다.");
        }
    }
}
