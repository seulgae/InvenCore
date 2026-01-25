package com.inven.core.backend.api.comment.repository;

import com.inven.core.backend.api.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByRequestBoardIdOrderByCreatedAtAsc(Long requestBoardId);
    List<Comment> findByRequestBoardIdAndParentIdIsNullOrderByCreatedAtAsc(Long requestBoardId);
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);
    void deleteByRequestBoardId(Long requestBoardId);
}
