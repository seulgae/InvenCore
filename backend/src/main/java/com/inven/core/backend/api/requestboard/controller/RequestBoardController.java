package com.inven.core.backend.api.requestboard.controller;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/requestboards")
@RequiredArgsConstructor
public class RequestBoardController {

    private final RequestBoardService requestBoardService;

    /**
     * 게시글 생성입니다. 입력값 확인 → 선택적 파일 저장 → 공용 demo 이름을 작성자로 지정 → 게시글 저장
     */
    @PostMapping
    public ResponseEntity<RequestBoardDTO> createRequestBoard(
        @Valid @RequestPart("requestBoardDTO") RequestBoardDTO requestBoardDTO,
        @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        log.info("POST /api/requestboards 요청 수신");
        RequestBoardDTO createdRequestBoard = requestBoardService.createRequestBoard(
            requestBoardDTO,
            "demo",
            file
        );
        log.info("요청 게시글 생성 완료: {}", createdRequestBoard.getTitle());
        return new ResponseEntity<>(createdRequestBoard, HttpStatus.CREATED);
    }

    /**
     * 게시글 상세 조회입니다. ID로 게시글 조회 → 없으면 예외 → DTO 반환
     */
    @GetMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> getRequestBoardById(@PathVariable Long id) {
        log.info("GET /api/requestboards/{} 요청 수신", id);
        return ResponseEntity.ok(requestBoardService.getRequestBoardById(id));
    }

    /**
     * 페이지·검색 조회입니다. 페이지·크기 범위 조정 → 검색어 유무에 따라 Repository 조회 → DTO 페이지
     * 반환
     */
    @GetMapping
    public ResponseEntity<Page<RequestBoardDTO>> getRequestBoards(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(requestBoardService.getRequestBoards(page, size, keyword));
    }

    /**
     * 게시글 수정입니다. 게시글 조회 → 입력 검증 → 파일 교체·삭제 처리 → 제목·내용 변경
     */
    @PutMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> updateRequestBoard(
        @PathVariable Long id,
        @Valid @RequestPart("requestBoardDTO") RequestBoardDTO requestBoardDTO,
        @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        log.info("PUT /api/requestboards/{} 요청 수신", id);
        RequestBoardDTO updatedRequestBoard = requestBoardService.updateRequestBoard(
            id,
            requestBoardDTO,
            file
        );
        log.info("요청 게시글 수정 완료: {}", updatedRequestBoard.getTitle());
        return ResponseEntity.ok(updatedRequestBoard);
    }

    /**
     * 게시글 삭제입니다. 게시글 조회 → 첨부파일 삭제 시도 → DB 게시글 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequestBoard(@PathVariable Long id) {
        log.info("DELETE /api/requestboards/{} 요청 수신", id);
        requestBoardService.deleteRequestBoard(id);
        log.info("요청 게시글 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 첨부 다운로드입니다. 게시글 조회 → 파일 경로 확인 → Resource 생성 → 존재·읽기 가능 여부 확인
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
        @PathVariable Long id,
        HttpServletRequest request
    ) {
        Resource resource = requestBoardService.downloadFile(id);
        String originalFileName = requestBoardService.getRequestBoardById(id).getFileName();

        String encodedFileName = URLEncoder.encode(
            originalFileName,
            StandardCharsets.UTF_8
        ).replaceAll("\\+", "%20");

        String contentType;
        try {
            contentType = request
                .getServletContext()
                .getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + encodedFileName + "\""
            )
            .body(resource);
    }
}
