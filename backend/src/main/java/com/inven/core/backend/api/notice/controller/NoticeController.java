package com.inven.core.backend.api.notice.controller;

import com.inven.core.backend.api.notice.dto.NoticeDTO;
import com.inven.core.backend.api.notice.service.NoticeService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    @PostMapping
    public ResponseEntity<NoticeDTO> createNotice(
            @Valid @RequestBody NoticeDTO noticeDTO,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : null;
        NoticeDTO created = noticeService.createNotice(noticeDTO, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeDTO> getNoticeById(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.getNoticeById(id));
    }

    // ✅ 프론트에서 사용하는 목록 조회 (List 반환)
    @GetMapping
    public ResponseEntity<List<NoticeDTO>> getAllNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoticeDTO> updateNotice(
            @PathVariable Long id,
            @Valid @RequestBody NoticeDTO noticeDTO,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(
                noticeService.updateNotice(id, noticeDTO, username)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long id,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : null;
        noticeService.deleteNotice(id, username);
        return ResponseEntity.noContent().build();
    }
}
