package com.inven.core.backend.api.comment.service;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import com.inven.core.backend.api.comment.entity.Comment;
import com.inven.core.backend.api.comment.repository.CommentRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    /**
     * 댓글·답글 등록입니다. 게시글 ID·부모 ID·내용·공용 demo 작성자를 엔티티에 담아 저장
     */
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

    /**
     * 댓글 트리 조회입니다. 부모 댓글 조회 → 부모별 답글 조회 → 부모 DTO에 답글 목록 연결
     */
    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByRequestBoardId(Long requestBoardId) {
        // 부모 댓글만 가져오기
        List<Comment> parentComments =
            commentRepository.findByRequestBoardIdAndParentIdIsNullOrderByCreatedAtAsc(
                requestBoardId
            );

        return parentComments
            .stream()
            .map(parent -> {
                CommentDTO parentDTO = convertToDTO(parent);
                // 각 부모 댓글의 답글 가져오기
                List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(
                    parent.getId()
                );
                List<CommentDTO> replyDTOs = replies
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
                return new CommentDTO(
                    parentDTO.getId(),
                    parentDTO.getRequestBoardId(),
                    parentDTO.getParentId(),
                    parentDTO.getContent(),
                    parentDTO.getAuthor(),
                    parentDTO.getCreatedAt(),
                    replyDTOs
                );
            })
            .collect(Collectors.toList());
    }

    /**
     * 댓글 수정입니다. ID 조회 → 내용 변경
     */
    @Transactional
    public CommentDTO updateComment(Long id, CommentDTO commentDTO) {
        Comment comment = commentRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid comment Id: " + id));

        comment.update(commentDTO.getContent());
        return convertToDTO(comment);
    }

    /**
     * 댓글 삭제입니다. ID 조회 → 직계 답글 삭제 → 원 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long id) {
        Comment comment = commentRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid comment Id: " + id));

        // 답글이 있으면 함께 삭제
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(id);
        commentRepository.deleteAll(replies);
        commentRepository.delete(comment);
    }

    /**
     * 응답 DTO 변환입니다. 댓글 엔티티의 ID·소속·내용·작성자·생성 시각을 DTO에 복사
     */
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
