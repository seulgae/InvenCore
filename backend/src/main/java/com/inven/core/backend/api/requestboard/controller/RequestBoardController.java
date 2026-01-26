package com.inven.core.backend.api.requestboard.controller;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/requestboards")
@RequiredArgsConstructor
public class RequestBoardController {

    private final RequestBoardService requestBoardService;

    @PostMapping
    public ResponseEntity<RequestBoardDTO> createRequestBoard(@Valid @RequestBody RequestBoardDTO requestBoardDTO,
                                                              Principal principal) {
        log.info("POST /api/requestboards 요청 수신");
        RequestBoardDTO createdRequestBoard =
                requestBoardService.createRequestBoard(requestBoardDTO, principal.getName());
        log.info("요청 게시글 생성 완료: {}", createdRequestBoard.getTitle());
        return new ResponseEntity<>(createdRequestBoard, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> getRequestBoardById(@PathVariable Long id) {
        log.info("GET /api/requestboards/{} 요청 수신", id);
        return ResponseEntity.ok(requestBoardService.getRequestBoardById(id));
    }

    @GetMapping
    public ResponseEntity<List<RequestBoardDTO>> getAllRequestBoards() {
        log.info("GET /api/requestboards 요청 수신");
        List<RequestBoardDTO> requestBoards = requestBoardService.getAllRequestBoards();
        log.info("요청 게시글 {}건 조회 완료", requestBoards.size());
        return ResponseEntity.ok(requestBoards);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequestBoardDTO> updateRequestBoard(@PathVariable Long id,
                                                              @Valid @RequestBody RequestBoardDTO requestBoardDTO,
                                                              Principal principal) {
        log.info("PUT /api/requestboards/{} 요청 수신", id);
        RequestBoardDTO updatedRequestBoard =
                requestBoardService.updateRequestBoard(id, requestBoardDTO, principal.getName());
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

    // ✅ Validation (400) 응답 포맷 통일: { message, errors }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> {
            errors.put(err.getField(), err.getDefaultMessage());
        });

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Validation failed");
        body.put("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // ✅ 권한 오류 (403): { message }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "권한이 없습니다.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ✅ 서비스에서 던진 IllegalArgumentException (400): { message }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
