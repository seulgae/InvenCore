package com.inven.core.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * [주의] Spring Security를 사용하는 경우, 이 설정 대신 SecurityConfig의 CORS 설정을 사용해야 합니다.
 * 중복 설정을 방지하기 위해 이 클래스는 비활성화(주석 처리) 상태로 유지하거나 삭제하는 것을 권장합니다.
 */
// @Configuration
public class WebConfig implements WebMvcConfigurer {

    // application.yml에서 관리하는 허용 Origin 목록을 주입받음
    // 예: app.cors.allowed-origins=http://localhost:5173,https://invencore.com
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private List<String> allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0])) // List를 배열로 변환하여 설정
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}