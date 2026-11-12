package com.inven.core.backend.api.member.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // ✅ null인 필드는 JSON에서 제외
public class MemberResponse {

    private String username;
    private String message;
    private String token;
    private Integer role;
    private boolean success;
}
