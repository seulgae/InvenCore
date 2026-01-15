package com.inven.core.backend.sample.member.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;

    // Lombok의 @Data 어노테이션이 getter, setter, equals, hashCode, toString을 자동으로 생성합니다.
    // 필요하다면 @NoArgsConstructor, @AllArgsConstructor 등을 추가할 수 있습니다.
}