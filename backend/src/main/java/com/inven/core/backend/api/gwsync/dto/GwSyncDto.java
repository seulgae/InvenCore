package com.inven.core.backend.api.gwsync.dto;

import com.inven.core.backend.api.gwsync.entity.*;
import jakarta.validation.constraints.*;
import lombok.Builder;
import java.time.Instant;

public final class GwSyncDto {
    private GwSyncDto() {}
    public record Input(@NotBlank @Size(max = 100) String name,
                        @NotNull @Size(max = 2000) String description) {}

    @Builder
    public record Source(String id, String name, String description, long revision,
                         long publishedRevision, boolean deleted, Instant updatedAt) {
        public static Source from(GwSource source) {
            return Source.builder().id(source.getId()).name(source.getName()).description(source.getDescription())
                    .revision(source.getRevision()).publishedRevision(source.getPublishedRevision())
                    .deleted(source.isDeleted()).updatedAt(source.getUpdatedAt()).build();
        }
    }

    @Builder
    public record Snapshot(String id, String name, String description, long revision,
                           boolean deleted, Instant sourceUpdatedAt, Instant syncedAt) {
        public static Snapshot from(GwTarget target) {
            return Snapshot.builder().id(target.getId()).name(target.getName()).description(target.getDescription())
                    .revision(target.getRevision()).deleted(target.isDeleted())
                    .sourceUpdatedAt(target.getSourceUpdatedAt()).syncedAt(target.getSyncedAt()).build();
        }
    }
    public record CacheView(String state, String key, long ttlSeconds, Snapshot snapshot) {}
    public record State(Source source, Snapshot target, CacheView cache, boolean synchronizedData) {}
    public record Status(boolean enabled, String mode, String transport, String cacheProvider,
                         String topic, String deadLetterTopic, long cacheTtlSeconds) {}
}
