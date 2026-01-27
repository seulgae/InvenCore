package com.inven.core.backend.api.notice.service.impl;

import com.inven.core.backend.api.notice.dto.NoticeDTO;
import com.inven.core.backend.api.notice.entity.Notice;
import com.inven.core.backend.api.notice.repository.NoticeRepository;
import com.inven.core.backend.api.notice.service.NoticeService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;

    @Override
    public NoticeDTO createNotice(NoticeDTO noticeDTO, String username) {
        Notice notice = Notice.builder()
                .title(noticeDTO.getTitle())
                .content(noticeDTO.getContent())
                .author(username)
                .build();

        return toDTO(noticeRepository.save(notice));
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeDTO getNoticeById(Long id) {
        return toDTO(findNotice(id));
    }

    // ✅ 프론트 NoticeList에서 사용하는 전체 목록
    @Override
    @Transactional(readOnly = true)
    public List<NoticeDTO> getAllNotices() {
        return noticeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // 페이징 + 검색 (필요 시)
    @Override
    @Transactional(readOnly = true)
    public Page<NoticeDTO> getNotices(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Notice> result = StringUtils.hasText(keyword)
                ? noticeRepository.findByTitleContainingIgnoreCase(keyword.trim(), pageable)
                : noticeRepository.findAll(pageable);

        return result.map(this::toDTO);
    }

    @Override
    public NoticeDTO updateNotice(Long id, NoticeDTO noticeDTO, String username) {
        Notice notice = findNotice(id);

        if (!notice.getAuthor().equals(username)) {
            throw new AccessDeniedException("권한 없음");
        }

        notice.update(noticeDTO.getTitle(), noticeDTO.getContent());
        return toDTO(notice);
    }

    @Override
    public void deleteNotice(Long id, String username) {
        Notice notice = findNotice(id);

        if (!notice.getAuthor().equals(username)) {
            throw new AccessDeniedException("권한 없음");
        }

        noticeRepository.delete(notice);
    }

    private Notice findNotice(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notice id: " + id));
    }

    private NoticeDTO toDTO(Notice notice) {
        return NoticeDTO.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .author(notice.getAuthor())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
