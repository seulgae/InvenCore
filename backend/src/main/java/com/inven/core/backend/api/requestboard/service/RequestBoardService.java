package com.inven.core.backend.api.requestboard.service;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface RequestBoardService {

    RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username, MultipartFile file);

    RequestBoardDTO getRequestBoardById(Long id);

    Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword);

    RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, MultipartFile file);

    void deleteRequestBoard(Long id);

    Resource downloadFile(Long id);
}
