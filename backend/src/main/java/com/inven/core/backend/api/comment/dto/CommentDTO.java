package com.inven.core.backend.api.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter; // Setter 임포트

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter // Setter 추가
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    
    @NotNull(message = "요청 게시판 ID는 필수입니다.")
    private Long requestBoardId;
    
    private Long parentId; // null이면 댓글, 값이 있으면 답글
    
    @NotBlank(message = "댓글 내용은 필수 입력 항목입니다.")
    @Size(max = 1000, message = "댓글은 1000자 이내로 입력해주세요.")
    private String content;
    
    private String author;
    private LocalDateTime createdAt;
    
    private List<CommentDTO> replies; // 답글 목록
}
