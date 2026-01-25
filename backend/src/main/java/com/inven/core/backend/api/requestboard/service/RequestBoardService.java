package com.inven.core.backend.api.requestboard.service;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import com.inven.core.backend.api.requestboard.repository.RequestBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestBoardService {

    private final RequestBoardRepository requestBoardRepository;

    @Transactional
    public RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username) {
        RequestBoard requestBoard = RequestBoard.builder()
                .title(requestBoardDTO.getTitle())
                .content(requestBoardDTO.getContent())
                .author(username)
                .build();
        RequestBoard savedRequestBoard = requestBoardRepository.save(requestBoard);
        return new RequestBoardDTO(savedRequestBoard.getId(), savedRequestBoard.getTitle(), savedRequestBoard.getContent(), savedRequestBoard.getAuthor(), savedRequestBoard.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public RequestBoardDTO getRequestBoardById(Long id) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));
        return new RequestBoardDTO(requestBoard.getId(), requestBoard.getTitle(), requestBoard.getContent(), requestBoard.getAuthor(), requestBoard.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<RequestBoardDTO> getAllRequestBoards() {
        return requestBoardRepository.findAll().stream()
                .map(requestBoard -> new RequestBoardDTO(requestBoard.getId(), requestBoard.getTitle(), requestBoard.getContent(), requestBoard.getAuthor(), requestBoard.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        requestBoard.update(requestBoardDTO.getTitle(), requestBoardDTO.getContent());
        return new RequestBoardDTO(requestBoard.getId(), requestBoard.getTitle(), requestBoard.getContent(), requestBoard.getAuthor(), requestBoard.getCreatedAt());
    }

    @Transactional
    public void deleteRequestBoard(Long id, String username) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        requestBoardRepository.delete(requestBoard);
    }
}
