package com.inven.core.backend.api.benchmark;

import lombok.Builder;
import java.util.List;

public final class BenchmarkResult {
    private BenchmarkResult() {}
    @Builder
    public record Status(boolean ready, int rowsPerTable, int processors, int parallelism,
                         String javaVersion, String database, double seedMillis) {}
    @Builder
    public record Measurement(String label, List<Double> samplesMs, double medianMs,
                              double minMs, double maxMs, String checksum) {}
    @Builder
    public record Comparison(String kind, String measuredAt, int warmups, int repetitions,
                             int operationsPerSample, int rows, Measurement baseline,
                             Measurement optimized, boolean resultsMatch, double speedup,
                             double changePercent, String baselinePlan, String optimizedPlan,
                             String sql, Status environment) {}
}
