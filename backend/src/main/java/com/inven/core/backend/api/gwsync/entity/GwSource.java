package com.inven.core.backend.api.gwsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "gw_source")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GwSource {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 2000)
    private String description;

    private long revision;
    private long publishedRevision;
    private boolean deleted;

    @Column(nullable = false)
    private Instant updatedAt;

    /**
     * 전달받은 값으로 GwSource 인스턴스를 초기화합니다.
     */
    @Builder
    public GwSource(String name, String description) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.description = description;
        this.revision = 1;
        this.updatedAt = Instant.now();
    }

    /**
     * 원본 변경입니다. 이름·설명 수정 → revision 증가 → 변경 시각 갱신. 변경과 발행 대기가 같은 원본 행에
     * 저장됩니다.
     */
    public void revise(String name, String description) {
        this.name = name;
        this.description = description;
        this.revision++;
        this.updatedAt = Instant.now();
    }

    /**
     * 삭제 이벤트 준비입니다. 삭제 표시 → revision 증가. 행을 보존해 오래된 이벤트로 되살아나는 것을
     * 방지합니다.
     */
    public void remove() {
        this.deleted = true;
        this.revision++;
        this.updatedAt = Instant.now();
    }

    /**
     * 발행 버전 확인입니다. Kafka ack를 받은 revision까지 발행 완료 표시. 이미 저장된 더 최신
     * revision은 대기로 유지합니다.
     */
    public void markPublished(long revision) {
        this.publishedRevision = Math.max(
            this.publishedRevision,
            Math.min(revision, this.revision)
        );
    }
}
