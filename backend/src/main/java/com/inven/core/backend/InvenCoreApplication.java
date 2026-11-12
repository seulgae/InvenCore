package com.inven.core.backend;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class InvenCoreApplication {

    /**
     * 애플리케이션에서 사용할 기본 시간대를 설정합니다.
     */
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }

    /**
     * Spring Boot 애플리케이션을 시작합니다.
     */
    public static void main(String[] args) {
        SpringApplication.run(InvenCoreApplication.class, args);
    }
}
