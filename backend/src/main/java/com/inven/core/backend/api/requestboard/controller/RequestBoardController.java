package com.inven.core.backend.api.requestboard.controller;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/requestboards")
@RequiredArgsConstructor
public class RequestBoardController {

    private final RequestBoardService requestBoardService;

    @PostMapping
    public ResponseEntity<RequestBoardDTO> createRequestBoard(
            @Valid @RequestPart("requestBoardDTO") RequestBoardDTO requestBoardDTO,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Principal principal
    ) {
        log.info("POST /api/requestboards 요청 수신");
        RequestBoardDTO createdRequestBoard =
                requestBoardService.createRequestBoard(requestBoardDTO, principal.getName(), file);
        log.info("요청 게시글 생성 완료: {}", createdRequestBoard.getTitle());
        return new ResponseEntity<>(createdRequestBoard, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> getRequestBoardById(@PathVariable Long id) {
        log.info("GET /api/requestboards/{} 요청 수신", id);
        return ResponseEntity.ok(requestBoardService.getRequestBoardById(id));
    }

    @GetMapping
    public ResponseEntity<Page<RequestBoardDTO>> getRequestBoards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(requestBoardService.getRequestBoards(page, size, keyword));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> updateRequestBoard(
            @PathVariable Long id,
            @Valid @RequestPart("requestBoardDTO") RequestBoardDTO requestBoardDTO,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Principal principal
    ) {
        log.info("PUT /api/requestboards/{} 요청 수신", id);
        RequestBoardDTO updatedRequestBoard =
                requestBoardService.updateRequestBoard(id, requestBoardDTO, principal.getName(), file);
        log.info("요청 게시글 수정 완료: {}", updatedRequestBoard.getTitle());
        return ResponseEntity.ok(updatedRequestBoard);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequestBoard(@PathVariable Long id, Principal principal) {
        log.info("DELETE /api/requestboards/{} 요청 수신", id);
        requestBoardService.deleteRequestBoard(id, principal.getName());
        log.info("요청 게시글 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id, HttpServletRequest request) {
        Resource resource = requestBoardService.downloadFile(id);
        String originalFileName = requestBoardService.getRequestBoardById(id).getFileName();

        String encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        
        String contentType;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }
        if(contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

}
