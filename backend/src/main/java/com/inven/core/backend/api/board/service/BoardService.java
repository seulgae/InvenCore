package com.inven.core.backend.api.board.service;

import com.inven.core.backend.api.board.dto.BoardDTO;
import com.inven.core.backend.api.board.entity.Board;
import com.inven.core.backend.api.board.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException; // 추가

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;

    // ✅ 작성자(username)를 파라미터로 받도록 수정
    @Transactional
    public BoardDTO createBoard(BoardDTO boardDTO, String username) {
        Board board = Board.builder()
                .title(boardDTO.getTitle())
                .content(boardDTO.getContent())
                .author(username) // ✅ 로그인한 사용자 ID로 설정
                .build();
        Board savedBoard = boardRepository.save(board);
        return new BoardDTO(savedBoard.getId(), savedBoard.getTitle(), savedBoard.getContent(), savedBoard.getAuthor(), savedBoard.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public BoardDTO getBoardById(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid board Id:" + id));
        return new BoardDTO(board.getId(), board.getTitle(), board.getContent(), board.getAuthor(), board.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<BoardDTO> getAllBoards() {
        return boardRepository.findAll().stream()
                .map(board -> new BoardDTO(board.getId(), board.getTitle(), board.getContent(), board.getAuthor(), board.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ✅ 수정 메서드 추가
    @Transactional
    public BoardDTO updateBoard(Long id, BoardDTO boardDTO, String username) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid board Id:" + id));

        // ✅ 작성자 본인만 수정 가능
        if (!board.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        board.update(boardDTO.getTitle(), boardDTO.getContent());
        return new BoardDTO(board.getId(), board.getTitle(), board.getContent(), board.getAuthor(), board.getCreatedAt());
    }

    // ✅ 삭제 메서드 추가
    @Transactional
    public void deleteBoard(Long id, String username) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid board Id:" + id));

        // ✅ 작성자 본인만 삭제 가능
        if (!board.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        boardRepository.delete(board);
    }
}