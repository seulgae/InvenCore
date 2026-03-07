package com.inven.core.backend.api.requestboard.service.impl;

import com.inven.core.backend.api.requestboard.dto.RequestBoardDTO;
import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import com.inven.core.backend.api.requestboard.repository.RequestBoardRepository;
import com.inven.core.backend.api.requestboard.service.RequestBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestBoardServiceImpl implements RequestBoardService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".csv", ".zip", ".rar", ".7z",
            ".png", ".jpg", ".jpeg", ".gif", ".bmp"
    );

    private final RequestBoardRepository requestBoardRepository;

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
                fileName = StringUtils.cleanPath(file.getOriginalFilename());
                validateFileExtension(fileName);

                File uploadDir = new File(this.uploadDir);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }

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
        return requestBoardRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
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
    public RequestBoardDTO updateRequestBoard(Long id, RequestBoardDTO requestBoardDTO, String username, MultipartFile file) {
        RequestBoard requestBoard = requestBoardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid request board Id: " + id));

        if (!StringUtils.hasText(requestBoardDTO.getTitle()) || !StringUtils.hasText(requestBoardDTO.getContent())) {
            throw new IllegalArgumentException("제목과 내용은 공백일 수 없습니다.");
        }

        if (!requestBoard.getAuthor().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        // 파일 처리
        handleFileUpdate(requestBoard, file, requestBoardDTO.isDeleteExistingFile());

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

        // 파일 삭제
        if (requestBoard.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(requestBoard.getFilePath()));
            } catch (IOException e) {
                log.warn("파일 삭제 실패: {}", requestBoard.getFilePath(), e);
            }
        }

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

        // 1. 기존 파일 삭제 플래그가 true인 경우
        if (deleteExisting && oldFilePath != null) {
            try {
                Files.deleteIfExists(Paths.get(oldFilePath));
                requestBoard.setFilePath(null);
                requestBoard.setFileName(null);
            } catch (IOException e) {
                log.warn("기존 파일 삭제 실패: {}", oldFilePath, e);
            }
        }

        // 2. 새로운 파일이 업로드된 경우
        if (newFile != null && !newFile.isEmpty()) {
            // 새 파일이 있으니, 기존 파일은 무조건 삭제
            if (oldFilePath != null) {
                try {
                    Files.deleteIfExists(Paths.get(oldFilePath));
                } catch (IOException e) {
                    log.warn("기존 파일 삭제 실패: {}", oldFilePath, e);
                }
            }

            // 새 파일 저장
            try {
                String fileName = StringUtils.cleanPath(newFile.getOriginalFilename());
                validateFileExtension(fileName);

                File uploadDir = new File(this.uploadDir);
                if (!uploadDir.exists()) uploadDir.mkdirs();
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


    private void validateFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new IllegalArgumentException("파일 확장자를 확인할 수 없습니다.");
        }
        String extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("허용되지 않는 파일 형식입니다: " + extension);
        }
    }

    private RequestBoardDTO toDTO(RequestBoard requestBoard) {
        return new RequestBoardDTO(
                requestBoard.getId(),
                requestBoard.getTitle(),
                requestBoard.getContent(),
                requestBoard.getAuthor(),
                requestBoard.getFilePath(),
                requestBoard.getFileName(),
                requestBoard.getCreatedAt()
        );
    }
}
