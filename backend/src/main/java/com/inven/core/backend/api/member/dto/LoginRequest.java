package com.inven.core.backend.api.member.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}