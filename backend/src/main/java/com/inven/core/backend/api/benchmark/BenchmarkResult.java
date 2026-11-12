package com.inven.core.backend.api.benchmark;

import java.util.List;
import lombok.Builder;

public final class BenchmarkResult {

    /**
     * 외부에서 인스턴스를 생성하지 않도록 기본 생성자를 제한합니다.
     */
    private BenchmarkResult() {}

    @Builder
    public record Status(
        boolean ready,
        int rowsPerTable,
        int processors,
        int parallelism,
        String javaVersion,
        String database,
        double seedMillis
    ) {}

    @Builder
    public record Measurement(
        String label,
        List<Double> samplesMs,
        double medianMs,
        double minMs,
        double maxMs,
        String checksum
    ) {}

    @Builder
    public record Comparison(
        String kind,
        String measuredAt,
        int warmups,
        int repetitions,
        int operationsPerSample,
        int rows,
        Measurement baseline,
        Measurement optimized,
        boolean resultsMatch,
        double speedup,
        double changePercent,
        String baselinePlan,
        String optimizedPlan,
        String sql,
        Status environment
    ) {}
}
