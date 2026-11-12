package com.inven.core.backend.api.benchmark;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class BenchmarkDataInitializer implements ApplicationRunner {

    private final BenchmarkService service;

    /**
     * 전달받은 값으로 BenchmarkDataInitializer 인스턴스를 초기화합니다.
     */
    public BenchmarkDataInitializer(BenchmarkService service) {
        this.service = service;
    }

    /**
     * 애플리케이션 시작 후 비교용 데이터와 인덱스를 준비합니다.
     */
    @Override
    public void run(ApplicationArguments args) {
        service.initialize();
    }
}
