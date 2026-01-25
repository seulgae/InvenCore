package com.inven.core.backend.api.notice.controller;

import com.inven.core.backend.api.notice.dto.NoticeDTO;
import com.inven.core.backend.api.notice.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @PostMapping
    public ResponseEntity<NoticeDTO> createNotice(@Valid @RequestBody NoticeDTO noticeDTO, Principal principal) {
        log.info("POST /api/notices 요청 수신");
        NoticeDTO createdNotice = noticeService.createNotice(noticeDTO, principal.getName());
        log.info("공지사항 생성 완료: {}", createdNotice.getTitle());
        return new ResponseEntity<>(createdNotice, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeDTO> getNoticeById(@PathVariable Long id) {
        log.info("GET /api/notices/{} 요청 수신", id);
        NoticeDTO noticeDTO = noticeService.getNoticeById(id);
        return ResponseEntity.ok(noticeDTO);
    }

    @GetMapping
    public ResponseEntity<List<NoticeDTO>> getAllNotices() {
        log.info("GET /api/notices 요청 수신");
        List<NoticeDTO> notices = noticeService.getAllNotices();
        log.info("공지사항 {}건 조회 완료", notices.size());
        return ResponseEntity.ok(notices);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoticeDTO> updateNotice(@PathVariable Long id, @Valid @RequestBody NoticeDTO noticeDTO, Principal principal) {
        log.info("PUT /api/notices/{} 요청 수신", id);
        NoticeDTO updatedNotice = noticeService.updateNotice(id, noticeDTO, principal.getName());
        log.info("공지사항 수정 완료: {}", updatedNotice.getTitle());
        return ResponseEntity.ok(updatedNotice);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id, Principal principal) {
        log.info("DELETE /api/notices/{} 요청 수신", id);
        noticeService.deleteNotice(id, principal.getName());
        log.info("공지사항 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
