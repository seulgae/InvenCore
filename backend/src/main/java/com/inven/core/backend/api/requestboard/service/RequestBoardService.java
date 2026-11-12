package com.inven.core.backend.api.requestboard.service;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface RequestBoardService {
    /**
     * 게시글 생성입니다. 입력값 확인 → 선택적 파일 저장 → 공용 demo 이름을 작성자로 지정 → 게시글 저장
     */
    RequestBoardDTO createRequestBoard(
        RequestBoardDTO requestBoardDTO,
        String username,
        MultipartFile file
    );

    /**
     * 게시글 상세 조회입니다. ID로 게시글 조회 → 없으면 예외 → DTO 반환
     */
    RequestBoardDTO getRequestBoardById(Long id);

    /**
     * 페이지·검색 조회입니다. 페이지·크기 범위 조정 → 검색어 유무에 따라 Repository 조회 → DTO 페이지
     * 반환
     */
    Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword);

    /**
     * 게시글 수정입니다. 게시글 조회 → 입력 검증 → 파일 교체·삭제 처리 → 제목·내용 변경
     */
    RequestBoardDTO updateRequestBoard(
        Long id,
        RequestBoardDTO requestBoardDTO,
        MultipartFile file
    );

    /**
     * 게시글 삭제입니다. 게시글 조회 → 첨부파일 삭제 시도 → DB 게시글 삭제
     */
    void deleteRequestBoard(Long id);

    /**
     * 첨부 다운로드입니다. 게시글 조회 → 파일 경로 확인 → Resource 생성 → 존재·읽기 가능 여부 확인
     */
    Resource downloadFile(Long id);
}
