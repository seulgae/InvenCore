package com.inven.core.backend.api.benchmark;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class BenchmarkDataInitializer implements ApplicationRunner {
    private final BenchmarkService service;
    public BenchmarkDataInitializer(BenchmarkService service) { this.service = service; }
    @Override public void run(ApplicationArguments args) { service.initialize(); }
}
