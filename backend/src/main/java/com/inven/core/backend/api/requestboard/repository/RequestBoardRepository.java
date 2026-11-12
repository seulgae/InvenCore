package com.inven.core.backend.api.requestboard.repository;

import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestBoardRepository extends JpaRepository<RequestBoard, Long> {
    // 제목 또는 내용 검색 조건과 페이지 범위를 함께 적용합니다.

    /**
     * 제목 또는 내용에 검색어가 포함된 게시글을 대소문자 구분 없이 페이지 조회합니다.
     */
    Page<RequestBoard> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
        String titleKeyword,
        String contentKeyword,
        Pageable pageable
    );
}
