package com.inven.core.backend.api.gwsync.dto;

import com.inven.core.backend.api.gwsync.entity.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import lombok.Builder;

public final class GwSyncDto {

    /**
     * 외부에서 인스턴스를 생성하지 않도록 기본 생성자를 제한합니다.
     */
    private GwSyncDto() {}

    public record Input(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Size(max = 2000) String description
    ) {}

    @Builder
    public record Source(
        String id,
        String name,
        String description,
        long revision,
        long publishedRevision,
        boolean deleted,
        Instant updatedAt
    ) {
        /**
         * 엔티티의 현재 필드를 조회용 불변 DTO로 변환합니다.
         */
        public static Source from(GwSource source) {
            return Source.builder()
                .id(source.getId())
                .name(source.getName())
                .description(source.getDescription())
                .revision(source.getRevision())
                .publishedRevision(source.getPublishedRevision())
                .deleted(source.isDeleted())
                .updatedAt(source.getUpdatedAt())
                .build();
        }
    }

    @Builder
    public record Snapshot(
        String id,
        String name,
        String description,
        long revision,
        boolean deleted,
        Instant sourceUpdatedAt,
        Instant syncedAt
    ) {
        /**
         * 엔티티의 현재 필드를 조회용 불변 DTO로 변환합니다.
         */
        public static Snapshot from(GwTarget target) {
            return Snapshot.builder()
                .id(target.getId())
                .name(target.getName())
                .description(target.getDescription())
                .revision(target.getRevision())
                .deleted(target.isDeleted())
                .sourceUpdatedAt(target.getSourceUpdatedAt())
                .syncedAt(target.getSyncedAt())
                .build();
        }
    }

    public record CacheView(String state, String key, long ttlSeconds, Snapshot snapshot) {}

    public record State(
        Source source,
        Snapshot target,
        CacheView cache,
        boolean synchronizedData
    ) {}

    public record Status(
        boolean enabled,
        String mode,
        String transport,
        String cacheProvider,
        String topic,
        String deadLetterTopic,
        long cacheTtlSeconds
    ) {}
}
