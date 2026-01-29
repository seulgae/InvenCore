package com.inven.core.backend.api.requestboard.service;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RequestBoardService {

    RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username, MultipartFile file);

    RequestBoardDTO getRequestBoardById(Long id);

    List<RequestBoardDTO> getAllRequestBoards();

    Page<RequestBoardDTO> getRequestBoards(int page, int size);

    Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword);

    RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username, MultipartFile file);

    void deleteRequestBoard(Long id, String username);

    Resource downloadFile(Long id); // 파일 다운로드 메서드 추가
}
