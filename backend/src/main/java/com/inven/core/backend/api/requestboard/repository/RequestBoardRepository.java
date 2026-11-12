package com.inven.core.backend.api.requestboard.repository;

import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestBoardRepository extends JpaRepository<RequestBoard, Long> {

    // ✅ 검색 + 페이징 (title OR content)
    Page<RequestBoard> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String titleKeyword,
            String contentKeyword,
            Pageable pageable
    );
}
