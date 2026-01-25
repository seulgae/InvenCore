package com.inven.core.backend.api.notice.repository;

import com.inven.core.backend.api.notice.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
}
