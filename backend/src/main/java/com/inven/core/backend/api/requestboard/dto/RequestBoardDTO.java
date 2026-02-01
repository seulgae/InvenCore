package com.inven.core.backend.api.requestboard.dto;

import com.inven.core.backend.api.comment.dto.CommentDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequestBoardDTO {
    private Long id;

    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    @Size(max = 50, message = "제목은 50자 이내로 입력해주세요.")
    @Pattern(
            regexp = "^[가-힣a-zA-Z0-9\\s.,!?:;\\-\\[\\]]*$",
            message = "제목에는 한글, 영문, 숫자, 공백, 구두점(.,!?:;-) 및 대괄호([])만 입력 가능합니다."
    )
    private String title;

    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    @Size(max = 5000, message = "내용은 5000자 이내로 입력해주세요.")
    private String content;

    private String author;
    private String filePath;
    private String fileName;
    private LocalDateTime createdAt;
    private boolean deleteExistingFile; // 파일 삭제 여부 플래그
    private List<CommentDTO> comments; // 댓글 목록 필드 추가

    // 기존 생성자는 유지하여 다른 코드에 영향을 주지 않도록 함
    public RequestBoardDTO(Long id, String title, String content, String author, String filePath, String fileName, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.author = author;
        this.filePath = filePath;
        this.fileName = fileName;
        this.createdAt = createdAt;
    }
}
