package com.inven.core.backend.api.benchmark;

import java.util.List;

public final class BenchmarkResult {
    private BenchmarkResult() {}
    public record Status(boolean ready, int rowsPerTable, int processors, int parallelism,
                         String javaVersion, String database, double seedMillis) {}
    public record Measurement(String label, List<Double> samplesMs, double medianMs,
                              double minMs, double maxMs, String checksum) {}
    public record Comparison(String kind, String measuredAt, int warmups, int repetitions,
                             int operationsPerSample, int rows, Measurement baseline,
                             Measurement optimized, boolean resultsMatch, double speedup,
                             double changePercent, String baselinePlan, String optimizedPlan,
                             String sql, Status environment) {}
}
