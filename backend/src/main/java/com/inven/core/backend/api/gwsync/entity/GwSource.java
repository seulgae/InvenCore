package com.inven.core.backend.api.gwsync.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gw_source")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GwSource {
    @Id @Column(length = 36) private String id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, length = 2000) private String description;
    private long revision;
    private long publishedRevision;
    private boolean deleted;
    @Column(nullable = false) private Instant updatedAt;

    @Builder
    public GwSource(String name, String description) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.description = description;
        this.revision = 1;
        this.updatedAt = Instant.now();
    }

    public void revise(String name, String description) {
        this.name = name;
        this.description = description;
        this.revision++;
        this.updatedAt = Instant.now();
    }

    public void remove() {
        this.deleted = true;
        this.revision++;
        this.updatedAt = Instant.now();
    }

    public void markPublished(long revision) {
        this.publishedRevision = Math.max(this.publishedRevision, Math.min(revision, this.revision));
    }
}
