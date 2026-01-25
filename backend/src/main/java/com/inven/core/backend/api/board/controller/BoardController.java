package com.inven.core.backend.api.board.controller;

import com.inven.core.backend.api.board.dto.BoardDTO;
import com.inven.core.backend.api.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ✅ Slf4j 임포트
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@Slf4j // ✅ 로그 사용을 위한 어노테이션
@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping
    public ResponseEntity<BoardDTO> createBoard(@RequestBody BoardDTO boardDTO, Principal principal) {
        log.info("POST /api/boards 요청 수신");
        BoardDTO createdBoard = boardService.createBoard(boardDTO, principal.getName());
        log.info("게시글 생성 완료: {}", createdBoard.getTitle());
        return new ResponseEntity<>(createdBoard, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDTO> getBoardById(@PathVariable Long id) {
        log.info("GET /api/boards/{} 요청 수신", id);
        BoardDTO boardDTO = boardService.getBoardById(id);
        return ResponseEntity.ok(boardDTO);
    }

    @GetMapping
    public ResponseEntity<List<BoardDTO>> getAllBoards() {
        log.info("GET /api/boards 요청 수신"); // ✅ 로그 추가
        List<BoardDTO> boards = boardService.getAllBoards();
        log.info("게시글 {}건 조회 완료", boards.size()); // ✅ 로그 추가
        return ResponseEntity.ok(boards);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardDTO> updateBoard(@PathVariable Long id, @RequestBody BoardDTO boardDTO, Principal principal) {
        log.info("PUT /api/boards/{} 요청 수신", id);
        BoardDTO updatedBoard = boardService.updateBoard(id, boardDTO, principal.getName());
        log.info("게시글 수정 완료: {}", updatedBoard.getTitle());
        return ResponseEntity.ok(updatedBoard);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id, Principal principal) {
        log.info("DELETE /api/boards/{} 요청 수신", id);
        boardService.deleteBoard(id, principal.getName());
        log.info("게시글 삭제 완료: id={}", id);
        return ResponseEntity.noContent().build();
    }
}