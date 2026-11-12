package com.inven.core.backend.api.comment.repository;

import com.inven.core.backend.api.comment.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    /**
     * 해당 게시글의 댓글을 작성 시각 오름차순으로 조회합니다.
     */
    List<Comment> findByRequestBoardIdOrderByCreatedAtAsc(Long requestBoardId);

    /**
     * 해당 게시글의 최상위 댓글만 작성 순서대로 조회합니다.
     */
    List<Comment> findByRequestBoardIdAndParentIdIsNullOrderByCreatedAtAsc(Long requestBoardId);

    /**
     * 지정한 부모 댓글의 답글을 작성 순서대로 조회합니다.
     */
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    /**
     * 게시글에 연결된 댓글을 삭제합니다.
     */
    void deleteByRequestBoardId(Long requestBoardId);
}
