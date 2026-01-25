package com.inven.core.backend;

import jakarta.annotation.PostConstruct; // ✅ PostConstruct 임포트
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone; // ✅ TimeZone 임포트

@SpringBootApplication
public class InvenCoreApplication {

	// ✅ 애플리케이션 시작 시 시간대 설정
	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

	public static void main(String[] args) {
		SpringApplication.run(InvenCoreApplication.class, args);
	}

}