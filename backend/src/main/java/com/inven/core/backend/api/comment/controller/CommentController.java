package com.inven.core.backend.api.comment.controller;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import com.inven.core.backend.api.comment.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentDTO> createComment(@Valid @RequestBody CommentDTO commentDTO, Principal principal) {
        log.info("POST /api/comments 요청 수신");
        CommentDTO createdComment = commentService.createComment(commentDTO, principal.getName());
        log.info("댓글 생성 완료: {}", createdComment.getId());
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    @GetMapping("/requestboard/{requestBoardId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByRequestBoardId(@PathVariable Long requestBoardId) {
        log.info("GET /api/comments/requestboard/{} 요청 수신", requestBoardId);
        List<CommentDTO> comments = commentService.getCommentsByRequestBoardId(requestBoardId);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentDTO> updateComment(@PathVariable Long id, @Valid @RequestBody CommentDTO commentDTO, Principal principal) {
        log.info("PUT /api/comments/{} 요청 수신", id);
        CommentDTO updatedComment = commentService.updateComment(id, commentDTO, principal.getName());
        log.info("댓글 수정 완료: {}", updatedComment.getId());
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Principal principal) {
        log.info("DELETE /api/comments/{} 요청 수신", id);
        commentService.deleteComment(id, principal.getName());
        log.info("댓글 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
