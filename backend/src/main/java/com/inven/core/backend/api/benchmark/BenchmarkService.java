package com.inven.core.backend.api.benchmark;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private static final String PLAIN = "bench_plain";
    private static final String INDEXED = "bench_indexed";
    private static final String QUERY = "SELECT COALESCE(SUM(amount), 0) FROM %s WHERE account_id = ? AND state = ?";
    private final JdbcTemplate jdbc;
    private final int rows;
    private final ForkJoinPool workers;
    private final ReentrantLock runLock = new ReentrantLock();
    private volatile boolean ready;
    private List<Long> inputs;
    private double seedMillis;
    private String database = "H2";

    public BenchmarkService(JdbcTemplate jdbc, @Value("${benchmark.rows:300000}") int rows) {
        if (rows < 1000 || rows > 1000000) throw new IllegalArgumentException("benchmark.rows must be 1000..1000000");
        this.jdbc = jdbc;
        this.rows = rows;
        this.workers = new ForkJoinPool(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors())));
    }

    public void initialize() {
        long started = System.nanoTime();
        for (String table : List.of(PLAIN, INDEXED)) {
            jdbc.execute("CREATE TABLE IF NOT EXISTS " + table + " (id BIGINT PRIMARY KEY, account_id INT NOT NULL, state INT NOT NULL, amount BIGINT NOT NULL)");
        }
        long count = jdbc.queryForObject("SELECT COUNT(*) FROM " + PLAIN, Long.class);
        long indexedCount = jdbc.queryForObject("SELECT COUNT(*) FROM " + INDEXED, Long.class);
        if (count != rows || indexedCount != rows) {
            jdbc.update("DELETE FROM " + PLAIN);
            jdbc.update("DELETE FROM " + INDEXED);
            jdbc.execute("INSERT INTO " + PLAIN + " SELECT X, MOD(X, 10000), MOD(FLOOR(X / 10000.0), 4), MOD(X * 7919, 100000) FROM SYSTEM_RANGE(1, " + rows + ")");
            jdbc.execute("INSERT INTO " + INDEXED + " SELECT * FROM " + PLAIN);
        }
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_bench_account_state ON " + INDEXED + " (account_id, state)");
        jdbc.execute("ANALYZE TABLE " + PLAIN);
        jdbc.execute("ANALYZE TABLE " + INDEXED);
        inputs = LongStream.rangeClosed(1, rows).boxed().toList();
        database = "H2 " + jdbc.queryForObject("SELECT H2VERSION()", String.class);
        seedMillis = (System.nanoTime() - started) / 1_000_000.0;
        ready = true;
    }

    public Status status() {
        return new Status(ready, rows, Runtime.getRuntime().availableProcessors(), workers.getParallelism(),
                System.getProperty("java.version"), database, seedMillis);
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
        String baselinePlan = jdbc.queryForObject("EXPLAIN ANALYZE " + QUERY.formatted(PLAIN), String.class, 100, 0);
        String optimizedPlan = jdbc.queryForObject("EXPLAIN ANALYZE " + QUERY.formatted(INDEXED), String.class, 100, 0);
        return measure("indexes", "복합 인덱스 없음", "복합 인덱스 적용", () -> queryBatch(PLAIN), () -> queryBatch(INDEXED), QUERY_BATCH,
                baselinePlan, optimizedPlan, QUERY.formatted("<동일 데이터 테이블>"));
    }

    private long queryBatch(String table) {
        long checksum = 0;
        for (int i = 0; i < QUERY_BATCH; i++) {
            checksum += jdbc.queryForObject(QUERY.formatted(table), Long.class, 100 + i * 997, i % 4);
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
        return new Comparison(kind, Instant.now().toString(), WARMUPS, REPETITIONS, operations, rows, left, right, true,
                left.medianMs() / right.medianMs(), (left.medianMs() - right.medianMs()) / left.medianMs() * 100,
                beforePlan, afterPlan, sql, status());
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
        return new Measurement(label, List.copyOf(times), sorted.get(sorted.size() / 2), sorted.get(0),
                sorted.get(sorted.size() - 1), Long.toString(checksum));
    }

    @PreDestroy public void close() { workers.shutdown(); }
}
