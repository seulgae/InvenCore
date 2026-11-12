package com.inven.core.backend.api.requestboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
    name = "request_boards",
    indexes = { @Index(name = "idx_request_boards_created_at", columnList = "createdAt") }
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

    /**
     * 전달받은 값으로 RequestBoard 인스턴스를 초기화합니다.
     */
    @Builder
    public RequestBoard(
        String title,
        String content,
        String author,
        String filePath,
        String fileName
    ) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.filePath = filePath;
        this.fileName = fileName;
    }

    /**
     * 게시글 제목과 내용을 변경합니다.
     */
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }
}
