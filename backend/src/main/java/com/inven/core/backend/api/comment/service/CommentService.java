package com.inven.core.backend.api.comment.service;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import com.inven.core.backend.api.comment.entity.Comment;
import com.inven.core.backend.api.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    @Transactional
    public CommentDTO createComment(CommentDTO commentDTO, String username) {
        Comment comment = Comment.builder()
                .requestBoardId(commentDTO.getRequestBoardId())
                .parentId(commentDTO.getParentId())
                .content(commentDTO.getContent())
                .author(username)
                .build();
        Comment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByRequestBoardId(Long requestBoardId) {
        // 부모 댓글만 가져오기
        List<Comment> parentComments = commentRepository.findByRequestBoardIdAndParentIdIsNullOrderByCreatedAtAsc(requestBoardId);
        
        return parentComments.stream()
                .map(parent -> {
                    CommentDTO parentDTO = convertToDTO(parent);
                    // 각 부모 댓글의 답글 가져오기
                    List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(parent.getId());
                    List<CommentDTO> replyDTOs = replies.stream()
                            .map(this::convertToDTO)
                            .collect(Collectors.toList());
                    parentDTO = new CommentDTO(
                            parentDTO.getId(),
                            parentDTO.getRequestBoardId(),
                            parentDTO.getParentId(),
                            parentDTO.getContent(),
                            parentDTO.getAuthor(),
                            parentDTO.getCreatedAt(),
                            replyDTOs
                    );
                    return parentDTO;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDTO updateComment(Long id, CommentDTO commentDTO, String username) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment Id: " + id));

        if (!comment.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        comment.update(commentDTO.getContent());
        return convertToDTO(comment);
    }

    @Transactional
    public void deleteComment(Long id, String username) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment Id: " + id));

        if (!comment.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        // 답글이 있으면 함께 삭제
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(id);
        commentRepository.deleteAll(replies);
        commentRepository.delete(comment);
    }

    private CommentDTO convertToDTO(Comment comment) {
        return new CommentDTO(
                comment.getId(),
                comment.getRequestBoardId(),
                comment.getParentId(),
                comment.getContent(),
                comment.getAuthor(),
                comment.getCreatedAt(),
                null
        );
    }
}
