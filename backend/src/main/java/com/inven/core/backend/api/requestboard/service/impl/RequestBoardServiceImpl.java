package com.inven.core.backend.api.requestboard.service.impl;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import com.inven.core.backend.api.comment.service.CommentService;
import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import com.inven.core.backend.api.requestboard.repository.RequestBoardRepository;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestBoardServiceImpl implements RequestBoardService {

    private final RequestBoardRepository requestBoardRepository;
    private final CommentService commentService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public RequestBoardDTO createRequestBoard(RequestBoardDTO requestBoardDTO, String username, MultipartFile file) {
        if (!StringUtils.hasText(requestBoardDTO.getTitle()) || !StringUtils.hasText(requestBoardDTO.getContent())) {
            throw new IllegalArgumentException("제목과 내용은 공백일 수 없습니다.");
        }

        String filePath = null;
        String fileName = null;

        if (file != null && !file.isEmpty()) {
            try {
                File uploadDir = new File(this.uploadDir);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }

                fileName = StringUtils.cleanPath(file.getOriginalFilename());
                String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;
                Path destination = Paths.get(this.uploadDir, uniqueFileName);
                Files.copy(file.getInputStream(), destination);

                filePath = destination.toString();
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드에 실패했습니다.", e);
            }
        }

        RequestBoard requestBoard = RequestBoard.builder()
                .title(requestBoardDTO.getTitle())
                .content(requestBoardDTO.getContent())
                .author(username)
                .filePath(filePath)
                .fileName(fileName)
                .build();

        RequestBoard saved = requestBoardRepository.save(requestBoard);
        return toDTO(saved, Collections.emptyList());
    }

    @Override
    @Transactional(readOnly = true)
    public RequestBoardDTO getRequestBoardById(Long id) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));
        
        List<CommentDTO> comments = commentService.getCommentsByRequestBoardId(id);
        log.info("게시글 ID [{}]: 조회된 댓글 수 = {}", id, comments.size());
        
        return toDTO(requestBoard, comments);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequestBoardDTO> getAllRequestBoards() {
        return requestBoardRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(board -> toDTO(board, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RequestBoardDTO> getRequestBoards(int page, int size) {
        return getRequestBoards(page, size, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RequestBoardDTO> getRequestBoards(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<RequestBoard> result = StringUtils.hasText(keyword)
                ? requestBoardRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(keyword.trim(), keyword.trim(), pageable)
                : requestBoardRepository.findAll(pageable);

        return result.map(board -> toDTO(board, null));
    }

    @Override
    @Transactional
    public RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username, MultipartFile file) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        handleFileUpdate(requestBoard, file, requestBoardDTO.isDeleteExistingFile());

        requestBoard.update(requestBoardDTO.getTitle(), requestBoardDTO.getContent());
        
        List<CommentDTO> comments = commentService.getCommentsByRequestBoardId(id);
        return toDTO(requestBoard, comments);
    }

    @Override
    @Transactional
    public void deleteRequestBoard(Long id, String username) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        // 1. 파일 먼저 삭제
        if (requestBoard.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(requestBoard.getFilePath()));
            } catch (IOException e) {
                log.error("파일 삭제 실패: {}", requestBoard.getFilePath(), e);
            }
        }

        // 2. 게시글에 종속된 모든 댓글 삭제 (서비스 위임)
        commentService.deleteCommentsByRequestBoardId(id);

        // 3. 게시글 삭제
        requestBoardRepository.delete(requestBoard);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadFile(Long id) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        String filePath = requestBoard.getFilePath();
        if (!StringUtils.hasText(filePath)) {
            throw new IllegalArgumentException("첨부파일이 존재하지 않습니다.");
        }

        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("파일을 읽을 수 없습니다: " + filePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("파일 경로가 올바르지 않습니다: " + filePath, e);
        }
    }

    private void handleFileUpdate(RequestBoard requestBoard, MultipartFile newFile, boolean deleteExisting) {
        String oldFilePath = requestBoard.getFilePath();

        if (deleteExisting && oldFilePath != null) {
            try {
                Files.deleteIfExists(Paths.get(oldFilePath));
                requestBoard.setFilePath(null);
                requestBoard.setFileName(null);
            } catch (IOException e) {
                log.error("기존 파일 삭제 실패: {}", oldFilePath, e);
            }
        }

        if (newFile != null && !newFile.isEmpty()) {
            if (oldFilePath != null) {
                try {
                    Files.deleteIfExists(Paths.get(oldFilePath));
                } catch (IOException e) {
                    log.error("기존 파일 삭제 실패: {}", oldFilePath, e);
                }
            }

            try {
                File uploadDir = new File(this.uploadDir);
                if (!uploadDir.exists()) uploadDir.mkdirs();

                String fileName = StringUtils.cleanPath(newFile.getOriginalFilename());
                String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;
                Path destination = Paths.get(this.uploadDir, uniqueFileName);
                Files.copy(newFile.getInputStream(), destination);

                requestBoard.setFilePath(destination.toString());
                requestBoard.setFileName(fileName);
            } catch (IOException e) {
                throw new RuntimeException("새 파일 업로드에 실패했습니다.", e);
            }
        }
    }

    private RequestBoardDTO toDTO(RequestBoard requestBoard, List<CommentDTO> comments) {
        RequestBoardDTO dto = new RequestBoardDTO(
                requestBoard.getId(),
                requestBoard.getTitle(),
                requestBoard.getContent(),
                requestBoard.getAuthor(),
                requestBoard.getFilePath(),
                requestBoard.getFileName(),
                requestBoard.getCreatedAt()
        );
        dto.setComments(comments);
        return dto;
    }
}
