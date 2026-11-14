package com.inven.core.backend.config;

import com.inven.core.backend.security.JwtAuthenticationFilter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 기본 Origin은 application.yml 한 곳에서 관리하고 환경변수로 대체할 수 있습니다.
    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsString;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * 전달받은 값으로 SecurityConfig 인스턴스를 초기화합니다.
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * 회원 비밀번호 저장과 비교에 사용할 BCrypt 인코더를 제공합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 허용한 프론트엔드 출처와 HTTP 메서드에 대한 CORS 정책을 구성합니다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = Stream.of(allowedOriginsString.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(
            Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        );
        configuration.setAllowedHeaders(
            Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With")
        );
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 공개 API와 인증 필요 경로를 구분하고 JWT 필터를 등록합니다.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .exceptionHandling(exceptions ->
                exceptions.authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(401);
                    response.setCharacterEncoding("UTF-8");
                    response.setContentType("application/json");
                    response
                        .getWriter()
                        .write(
                            "{\"code\":\"AUTHENTICATION_REQUIRED\",\"message\":\"로그인이 필요하거나 인증이 만료되었습니다. 다시 로그인해 주세요.\"}"
                        );
                })
            )

            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/", "/error", "/favicon.ico")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/guestbook")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/guestbook")
                    .permitAll()
                    .requestMatchers("/api/health")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/guestbook")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/guestbook")
                    .permitAll()
                    .requestMatchers("/api/benchmarks", "/api/benchmarks/**")
                    .permitAll()
                    .requestMatchers("/api/gw-sync/**")
                    .permitAll()
                    .requestMatchers("/api/order-lab/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/practice/*/check")
                    .permitAll()
                    .requestMatchers(
                        "/api/members/login",
                        "/api/members/register",
                        "/api/members/check-username"
                    )
                    .permitAll()

                    // 샘플 게시판은 공개하고, SSH 등 나머지 보호 API의 인증은 유지합니다.
                    .requestMatchers(
                        "/api/requestboards",
                        "/api/requestboards/**",
                        "/api/comments",
                        "/api/comments/**"
                    )
                    .permitAll()

                    // 그 외 모든 요청은 인증 필요
                    .anyRequest()
                    .authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
