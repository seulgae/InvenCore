package com.inven.core.backend.api.notice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeDTO {

    private Long id;

    @NotBlank
    @Size(max = 50)
    @Pattern(regexp = "^[가-힣a-zA-Z0-9\\s.,!?:;\\-]+$")
    private String title;

    @NotBlank
    @Size(max = 5000)
    private String content;

    private String author;
    private LocalDateTime createdAt;
}
