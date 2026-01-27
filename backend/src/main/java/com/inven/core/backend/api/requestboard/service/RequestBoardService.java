package com.inven.core.backend.api.requestboard.service;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface RequestBoardService {

    RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username);

    RequestBoardDTO getRequestBoardById(Long id);

    // 기존 전체 조회 (필요하면 유지)
    List<RequestBoardDTO> getAllRequestBoards();

    /**
     * ✅ 서버 페이징 조회 (기본)
     * page: 0-base
     * size: 페이지 크기
     */
    Page<RequestBoardDTO> getRequestBoards(int page, int size);

    /**
     * ✅ 검색 + 서버 페이징 조회 (신규)
     * keyword가 null/blank면 전체 조회와 동일하게 처리
     */
    Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword);

    RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username);

    void deleteRequestBoard(Long id, String username);
}
