package com.inven.core.backend.api.requestboard.service.impl;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import com.inven.core.backend.api.requestboard.repository.RequestBoardRepository;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestBoardServiceImpl implements RequestBoardService {

    private final RequestBoardRepository requestBoardRepository;

    @Override
    @Transactional
    public RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username) {
        // ✅ 백엔드 공백 유효성 검사
        if (!StringUtils.hasText(requestBoardDTO.getTitle()) || !StringUtils.hasText(requestBoardDTO.getContent())) {
            throw new IllegalArgumentException("제목과 내용은 공백일 수 없습니다.");
        }

        RequestBoard requestBoard = RequestBoard.builder()
                .title(requestBoardDTO.getTitle())
                .content(requestBoardDTO.getContent())
                .author(username)
                .build();

        RequestBoard saved = requestBoardRepository.save(requestBoard);
        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestBoardDTO getRequestBoardById(Long id) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));
        return toDTO(requestBoard);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequestBoardDTO> getAllRequestBoards() {
        // ✅ 정렬 보장(최신순)
        return requestBoardRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * ✅ 서버 페이징(기본)
     * 내부적으로 keyword 없는 검색 페이징 메서드 호출하도록 통일
     */
    @Override
    @Transactional(readOnly = true)
    public Page<RequestBoardDTO> getRequestBoards(int page, int size) {
        return getRequestBoards(page, size, null);
    }

    /**
     * ✅ 검색 + 서버 페이징
     * keyword가 null/blank면 전체 조회와 동일
     */
    @Override
    @Transactional(readOnly = true)
    public Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 50) size = 50;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<RequestBoard> result;
        if (!StringUtils.hasText(keyword)) {
            result = requestBoardRepository.findAll(pageable);
        } else {
            String k = keyword.trim();
            result = requestBoardRepository
                    .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(k, k, pageable);
        }

        return result.map(this::toDTO);
    }

    @Override
    @Transactional
    public RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        // ✅ 유효성 검사를 권한 확인보다 먼저 수행
        if (!StringUtils.hasText(requestBoardDTO.getTitle()) || !StringUtils.hasText(requestBoardDTO.getContent())) {
            throw new IllegalArgumentException("제목과 내용은 공백일 수 없습니다.");
        }

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        requestBoard.update(requestBoardDTO.getTitle(), requestBoardDTO.getContent());
        return toDTO(requestBoard);
    }

    @Override
    @Transactional
    public void deleteRequestBoard(Long id, String username) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        requestBoardRepository.delete(requestBoard);
    }

    private RequestBoardDTO toDTO(RequestBoard requestBoard) {
        return new RequestBoardDTO(
                requestBoard.getId(),
                requestBoard.getTitle(),
                requestBoard.getContent(),
                requestBoard.getAuthor(),
                requestBoard.getCreatedAt()
        );
    }
}
