package com.inven.core.backend.api.benchmark;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/benchmarks")
public class BenchmarkController {

    private final BenchmarkService service;

    /**
     * 전달받은 값으로 BenchmarkController 인스턴스를 초기화합니다.
     */
    public BenchmarkController(BenchmarkService service) {
        this.service = service;
    }

    /**
     * 벤치마크 데이터 준비 여부와 실행 환경 정보를 반환합니다.
     */
    @GetMapping
    public BenchmarkResult.Status status() {
        return service.status();
    }

    /**
     * 실행 종류를 확인하고 측정 잠금을 획득한 뒤 비교 결과를 반환합니다. 잠금은 성공·실패와 관계없이 해제합니다.
     */
    @PostMapping("/{kind}")
    public ResponseEntity<?> run(@PathVariable String kind) {
        if (!kind.equals("streams") && !kind.equals("indexes")) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "지원하지 않는 성능 실험입니다.")
            );
        }
        if (!service.status().ready()) {
            return ResponseEntity.status(503).body(
                Map.of("message", "비교 데이터를 준비 중입니다. 잠시 후 다시 실행하세요.")
            );
        }
        if (!service.tryAcquire()) {
            return ResponseEntity.status(409).body(
                Map.of("message", "다른 성능 실험을 실행 중입니다. 완료 후 다시 실행하세요.")
            );
        }
        try {
            return ResponseEntity.ok(
                kind.equals("streams") ? service.streams() : service.indexes()
            );
        } finally {
            service.release();
        }
    }
}
