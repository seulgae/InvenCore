package com.inven.core.backend.api.benchmark;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/benchmarks")
public class BenchmarkController {
    private final BenchmarkService service;
    public BenchmarkController(BenchmarkService service) { this.service = service; }
    @GetMapping public BenchmarkResult.Status status() { return service.status(); }

    @PostMapping("/{kind}")
    public ResponseEntity<?> run(@PathVariable String kind) {
        if (!kind.equals("streams") && !kind.equals("indexes"))
            return ResponseEntity.badRequest().body(Map.of("message", "지원하지 않는 성능 실험입니다."));
        if (!service.status().ready())
            return ResponseEntity.status(503).body(Map.of("message", "비교 데이터를 준비 중입니다. 잠시 후 다시 실행하세요."));
        if (!service.tryAcquire())
            return ResponseEntity.status(409).body(Map.of("message", "다른 성능 실험을 실행 중입니다. 완료 후 다시 실행하세요."));
        try { return ResponseEntity.ok(kind.equals("streams") ? service.streams() : service.indexes()); }
        finally { service.release(); }
    }
}
