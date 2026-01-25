package com.inven.core.backend.api.notice.service;

import com.inven.core.backend.api.notice.dto.NoticeDTO;
import com.inven.core.backend.api.notice.entity.Notice;
import com.inven.core.backend.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    @Transactional
    public NoticeDTO createNotice(NoticeDTO noticeDTO, String username) {
        Notice notice = Notice.builder()
                .title(noticeDTO.getTitle())
                .content(noticeDTO.getContent())
                .author(username)
                .build();
        Notice savedNotice = noticeRepository.save(notice);
        return new NoticeDTO(savedNotice.getId(), savedNotice.getTitle(), savedNotice.getContent(), savedNotice.getAuthor(), savedNotice.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public NoticeDTO getNoticeById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notice Id: " + id));
        return new NoticeDTO(notice.getId(), notice.getTitle(), notice.getContent(), notice.getAuthor(), notice.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<NoticeDTO> getAllNotices() {
        return noticeRepository.findAll().stream()
                .map(notice -> new NoticeDTO(notice.getId(), notice.getTitle(), notice.getContent(), notice.getAuthor(), notice.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public NoticeDTO updateNotice(Long id, NoticeDTO noticeDTO, String username) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notice Id: " + id));

        if (!notice.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        notice.update(noticeDTO.getTitle(), noticeDTO.getContent());
        return new NoticeDTO(notice.getId(), notice.getTitle(), notice.getContent(), notice.getAuthor(), notice.getCreatedAt());
    }

    @Transactional
    public void deleteNotice(Long id, String username) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notice Id: " + id));

        if (!notice.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        noticeRepository.delete(notice);
    }
}
