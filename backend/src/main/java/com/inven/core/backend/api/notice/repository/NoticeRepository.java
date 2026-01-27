package com.inven.core.backend.api.notice.repository;

import com.inven.core.backend.api.notice.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Page<Notice> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
