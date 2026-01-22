package com.inven.core.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.inven.core.backend.security.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // application.yml에서 CORS 허용 리스트를 관리
    // 문자열로 받아서 쉼표로 분리하여 List로 변환
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsString;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 문자열을 쉼표로 분리하여 List로 변환
        List<String> allowedOrigins = Stream.of(allowedOriginsString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        
        // yml 설정값 사용 (없으면 기본값)
        configuration.setAllowedOrigins(allowedOrigins);

        // 보안상 필요한 메서드만 허용하는 것이 좋음
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type")); // 클라이언트가 토큰을 읽으려면 필수

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable) // 폼 로그인 비활성화 (JWT 사용 시)
                .httpBasic(AbstractHttpConfigurer::disable) // HTTP Basic 인증 비활성화

                .authorizeHttpRequests(auth -> auth
                        // 1. 정적 리소스 및 Preflight 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/error", "/favicon.ico").permitAll()

                        // 2. Health Check 엔드포인트 허용
                        .requestMatchers("/api/health", "/actuator/health").permitAll()

                        // 3. 인증 없이 접근 가능한 공개 API (로그인, 회원가입)
                        .requestMatchers("/api/members/login", "/api/members/register").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // 4. Swagger 문서 (사용한다면)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // 5. 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                );

        // JWT 필터 추가 (UsernamePasswordAuthenticationFilter 앞에서 실행)
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}