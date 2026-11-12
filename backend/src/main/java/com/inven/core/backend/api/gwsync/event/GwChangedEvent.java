package com.inven.core.backend.api.gwsync.event;

import com.inven.core.backend.api.gwsync.entity.GwSource;
import lombok.Builder;
import java.time.Instant;

@Builder
public record GwChangedEvent(int schemaVersion, String id, String name, String description,
                             long revision, boolean deleted, Instant updatedAt) {
    public static GwChangedEvent from(GwSource source) {
        return GwChangedEvent.builder().schemaVersion(1).id(source.getId()).name(source.getName())
                .description(source.getDescription()).revision(source.getRevision())
                .deleted(source.isDeleted()).updatedAt(source.getUpdatedAt()).build();
    }

    public void validate() {
        if (schemaVersion != 1 || id == null || !id.matches("[0-9a-fA-F-]{36}") || revision < 1
                || name == null || name.isBlank() || name.length() > 100
                || description == null || description.length() > 2000 || updatedAt == null)
            throw new IllegalArgumentException("유효하지 않은 GW 이벤트입니다.");
    }
}
