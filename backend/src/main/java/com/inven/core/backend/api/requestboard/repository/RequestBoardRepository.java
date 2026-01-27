package com.inven.core.backend.api.requestboard.repository;

import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestBoardRepository extends JpaRepository<RequestBoard, Long> {

    // ✅ 전체 조회 (최신순)
    List<RequestBoard> findAllByOrderByCreatedAtDesc();

    // ✅ 작성자별 조회 (최신순)
    List<RequestBoard> findByAuthorOrderByCreatedAtDesc(String author);

    // ✅ 권한 체크용
    boolean existsByIdAndAuthor(Long id, String author);

    // ✅ 검색 + 페이징 (title OR content)
    Page<RequestBoard> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String titleKeyword,
            String contentKeyword,
            Pageable pageable
    );
}
