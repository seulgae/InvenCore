package com.inven.core.backend.api.comment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requestBoardId; // 요청 게시판 ID

    @Column(nullable = true)
    private Long parentId; // null이면 댓글, 값이 있으면 답글

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 50)
    private String author;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 전달받은 값으로 Comment 인스턴스를 초기화합니다.
     */
    @Builder
    public Comment(Long requestBoardId, Long parentId, String content, String author) {
        this.requestBoardId = requestBoardId;
        this.parentId = parentId;
        this.content = content;
        this.author = author;
    }

    /**
     * 댓글 내용을 변경하고 수정 시각을 갱신합니다.
     */
    public void update(String content) {
        this.content = content;
    }
}
