package com.inven.core.backend.api.gwsync.entity;

import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "gw_target")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GwTarget {
    @Id @Column(length = 36) private String id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, length = 2000) private String description;
    private long revision;
    private boolean deleted;
    @Column(nullable = false) private Instant sourceUpdatedAt;
    @Column(nullable = false) private Instant syncedAt;

    @Builder
    public GwTarget(String id) { this.id = id; }

    public void apply(GwChangedEvent event) {
        this.name = event.name();
        this.description = event.description();
        this.revision = event.revision();
        this.deleted = event.deleted();
        this.sourceUpdatedAt = event.updatedAt();
        this.syncedAt = Instant.now();
    }
}
