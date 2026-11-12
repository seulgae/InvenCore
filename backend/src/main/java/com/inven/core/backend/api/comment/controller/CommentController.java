package com.inven.core.backend.api.comment.controller;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import com.inven.core.backend.api.comment.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * 댓글·답글 등록입니다. 게시글 ID·부모 ID·내용·공용 demo 작성자를 엔티티에 담아 저장
     */
    @PostMapping
    public ResponseEntity<CommentDTO> createComment(@Valid @RequestBody CommentDTO commentDTO) {
        log.info("POST /api/comments 요청 수신");
        CommentDTO createdComment = commentService.createComment(commentDTO, "demo");
        log.info("댓글 생성 완료: {}", createdComment.getId());
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    /**
     * 댓글 트리 조회입니다. 부모 댓글 조회 → 부모별 답글 조회 → 부모 DTO에 답글 목록 연결
     */
    @GetMapping("/requestboard/{requestBoardId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByRequestBoardId(
        @PathVariable Long requestBoardId
    ) {
        log.info("GET /api/comments/requestboard/{} 요청 수신", requestBoardId);
        List<CommentDTO> comments = commentService.getCommentsByRequestBoardId(requestBoardId);
        return ResponseEntity.ok(comments);
    }

    /**
     * 댓글 수정입니다. ID 조회 → 내용 변경
     */
    @PutMapping("/{id}")
    public ResponseEntity<CommentDTO> updateComment(
        @PathVariable Long id,
        @Valid @RequestBody CommentDTO commentDTO
    ) {
        log.info("PUT /api/comments/{} 요청 수신", id);
        CommentDTO updatedComment = commentService.updateComment(id, commentDTO);
        log.info("댓글 수정 완료: {}", updatedComment.getId());
        return ResponseEntity.ok(updatedComment);
    }

    /**
     * 댓글 삭제입니다. ID 조회 → 직계 답글 삭제 → 원 댓글 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        log.info("DELETE /api/comments/{} 요청 수신", id);
        commentService.deleteComment(id);
        log.info("댓글 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
