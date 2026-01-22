package com.inven.core.backend.api.member.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private String username;
    private String message;
    private String token; // 로그인 성공 시 JWT 토큰 등 포함
    private boolean success; // 요청 성공 여부

}