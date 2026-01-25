package com.inven.core.backend.api.requestboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RequestBoardDTO {
    private Long id;
    
    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    @Size(max = 50, message = "제목은 50자 이내로 입력해주세요.")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9\\s.,!?:;\\-]+$", message = "제목에는 한글, 영문, 숫자, 공백, 구두점(.,!?:;-)만 입력 가능합니다.")
    private String title;
    
    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    @Size(max = 5000, message = "내용은 5000자 이내로 입력해주세요.")
    private String content;
    
    private String author;
    private LocalDateTime createdAt;
}
