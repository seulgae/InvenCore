package com.inven.core.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring Security를 사용하는 경우 SecurityConfig에서 CORS를 관리합니다.
 * 이 WebConfig는 SecurityConfig와 충돌을 방지하기 위해 비활성화합니다.
 * 필요시 @Configuration 어노테이션을 주석 해제하여 활성화할 수 있습니다.
 */
// @Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 애플리케이션의 모든 엔드포인트에 CORS 설정을 적용합니다.
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://52.78.176.155:5173",
                        "https://invencore.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // 허용할 HTTP 메서드를 지정합니다.
                .allowedHeaders("*") // 모든 헤더를 허용합니다.
                .allowCredentials(true) // 쿠키 등 인증 정보를 포함한 요청을 허용합니다.
                .maxAge(3600); // pre-flight 요청의 결과를 캐시할 시간을 초 단위로 설정합니다.
    }
}