package com.inven.core.backend.api.benchmark;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import com.inven.core.backend.api.benchmark.mapper.BenchmarkMapper;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.LongSupplier;
import java.util.stream.LongStream;
import static com.inven.core.backend.api.benchmark.BenchmarkResult.*;

@Service
public class BenchmarkService {
    private static final int WARMUPS = 2;
    private static final int REPETITIONS = 5;
    private static final int QUERY_BATCH = 8;
    private static final String QUERY = "SELECT COALESCE(SUM(amount), 0) FROM %s WHERE account_id = ? AND state = ?";
    private final BenchmarkMapper mapper;
    private final int rows;
    private final ForkJoinPool workers;
    private final ReentrantLock runLock = new ReentrantLock();
    private volatile boolean ready;
    private List<Long> inputs;
    private double seedMillis;
    private String database = "H2";

    public BenchmarkService(BenchmarkMapper mapper, @Value("${benchmark.rows:300000}") int rows) {
        if (rows < 1000 || rows > 1000000) throw new IllegalArgumentException("benchmark.rows must be 1000..1000000");
        this.mapper = mapper;
        this.rows = rows;
        this.workers = new ForkJoinPool(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors())));
    }

    public void initialize() {
        long started = System.nanoTime();
        mapper.createTable(false);
        mapper.createTable(true);
        long count = mapper.countRows(false);
        long indexedCount = mapper.countRows(true);
        if (count != rows || indexedCount != rows) {
            mapper.clearTable(false);
            mapper.clearTable(true);
            mapper.seedPlain(rows);
            mapper.copyIndexed();
        }
        mapper.createIndex();
        mapper.analyze(false);
        mapper.analyze(true);
        inputs = LongStream.rangeClosed(1, rows).boxed().toList();
        database = "H2 " + mapper.databaseVersion();
        seedMillis = (System.nanoTime() - started) / 1_000_000.0;
        ready = true;
    }

    public Status status() {
        return Status.builder()
                .ready(ready)
                .rowsPerTable(rows)
                .processors(Runtime.getRuntime().availableProcessors())
                .parallelism(workers.getParallelism())
                .javaVersion(System.getProperty("java.version"))
                .database(database)
                .seedMillis(seedMillis)
                .build();
    }

    public boolean tryAcquire() { return ready && runLock.tryLock(); }
    public void release() { runLock.unlock(); }

    // CPU-only deterministic work; no sleeping, shared mutation or DB access.
    public long score(long value) {
        long result = value;
        for (int round = 0; round < 64; round++) {
            result = (result ^ (result >>> 27)) * 0x3C79AC492BA7B653L;
            result = Long.rotateLeft(result, 17) ^ round;
        }
        return result & 0xFFFFF;
    }

    public Comparison streams() {
        LongSupplier sequential = () -> inputs.stream().mapToLong(this::score).sum();
        LongSupplier parallel = () -> workers.submit(() -> inputs.parallelStream().mapToLong(this::score).sum()).join();
        return measure("streams", "순차 스트림", "병렬 스트림", sequential, parallel, 1, "", "", "");
    }

    public Comparison indexes() {
        String baselinePlan = mapper.explain(false, 100, 0);
        String optimizedPlan = mapper.explain(true, 100, 0);
        return measure("indexes", "복합 인덱스 없음", "복합 인덱스 적용", () -> queryBatch(false), () -> queryBatch(true), QUERY_BATCH,
                baselinePlan, optimizedPlan, QUERY.formatted("<동일 데이터 테이블>"));
    }

    private long queryBatch(boolean indexed) {
        long checksum = 0;
        for (int i = 0; i < QUERY_BATCH; i++) {
            checksum += mapper.sumAmount(indexed, 100 + i * 997, i % 4);
        }
        return checksum;
    }

    private Comparison measure(String kind, String before, String after, LongSupplier baseline, LongSupplier optimized,
                               int operations, String beforePlan, String afterPlan, String sql) {
        long expected = baseline.getAsLong();
        if (expected != optimized.getAsLong()) throw new RuntimeException("비교 대상의 계산 결과가 다릅니다.");
        for (int i = 0; i < WARMUPS; i++) {
            if (i % 2 == 0) { baseline.getAsLong(); optimized.getAsLong(); }
            else { optimized.getAsLong(); baseline.getAsLong(); }
        }
        List<Double> beforeTimes = new ArrayList<>();
        List<Double> afterTimes = new ArrayList<>();
        for (int i = 0; i < REPETITIONS; i++) {
            if (i % 2 == 0) { beforeTimes.add(time(baseline, expected)); afterTimes.add(time(optimized, expected)); }
            else { afterTimes.add(time(optimized, expected)); beforeTimes.add(time(baseline, expected)); }
        }
        Measurement left = summarize(before, beforeTimes, expected);
        Measurement right = summarize(after, afterTimes, expected);
        return Comparison.builder()
                .kind(kind)
                .measuredAt(Instant.now().toString())
                .warmups(WARMUPS)
                .repetitions(REPETITIONS)
                .operationsPerSample(operations)
                .rows(rows)
                .baseline(left)
                .optimized(right)
                .resultsMatch(true)
                .speedup(left.medianMs() / right.medianMs())
                .changePercent((left.medianMs() - right.medianMs()) / left.medianMs() * 100)
                .baselinePlan(beforePlan)
                .optimizedPlan(afterPlan)
                .sql(sql)
                .environment(status())
                .build();
    }

    private double time(LongSupplier work, long expected) {
        long started = System.nanoTime();
        long actual = work.getAsLong();
        long duration = System.nanoTime() - started;
        if (actual != expected) throw new RuntimeException("측정 중 계산 결과가 변경되었습니다.");
        return Math.max(1, duration) / 1_000_000.0;
    }

    private Measurement summarize(String label, List<Double> times, long checksum) {
        List<Double> sorted = times.stream().sorted().toList();
        return Measurement.builder()
                .label(label)
                .samplesMs(List.copyOf(times))
                .medianMs(sorted.get(sorted.size() / 2))
                .minMs(sorted.get(0))
                .maxMs(sorted.get(sorted.size() - 1))
                .checksum(Long.toString(checksum))
                .build();
    }

    @PreDestroy public void close() { workers.shutdown(); }
}
