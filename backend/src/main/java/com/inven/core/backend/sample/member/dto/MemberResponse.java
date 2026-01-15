package com.inven.core.backend.sample.member.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private String username;
    private String message;
    private String token; // 로그인 성공 시 JWT 토큰 등을 여기에 포함할 수 있습니다.
    private boolean success; // 요청 성공 여부

    // Lombok 어노테이션으로 생성자, getter, setter 등이 자동 생성됩니다.
}