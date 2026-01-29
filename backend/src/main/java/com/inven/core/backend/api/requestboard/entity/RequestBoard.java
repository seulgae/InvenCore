package com.inven.core.backend.api.requestboard.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter; // ✅ Setter 임포트
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter // ✅ Setter 추가
@NoArgsConstructor
@Table(
        name = "request_boards",
        indexes = {
                @Index(name = "idx_request_boards_created_at", columnList = "createdAt")
        }
)
public class RequestBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 50)
    private String author;

    @Column(length = 255)
    private String filePath;

    @Column(length = 255)
    private String fileName;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public RequestBoard(String title, String content, String author, String filePath, String fileName) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.filePath = filePath;
        this.fileName = fileName;
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }
}
