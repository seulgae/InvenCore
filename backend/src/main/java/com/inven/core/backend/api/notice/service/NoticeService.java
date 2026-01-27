package com.inven.core.backend.api.notice.service;

import com.inven.core.backend.api.notice.dto.NoticeDTO;
import java.util.List;
import org.springframework.data.domain.Page;

public interface NoticeService {

    NoticeDTO createNotice(NoticeDTO noticeDTO, String username);

    NoticeDTO getNoticeById(Long id);

    // 목록 조회 (프론트 NoticeList용)
    List<NoticeDTO> getAllNotices();

    // 페이징 + 검색
    Page<NoticeDTO> getNotices(int page, int size, String keyword);

    NoticeDTO updateNotice(Long id, NoticeDTO noticeDTO, String username);

    void deleteNotice(Long id, String username);
}
