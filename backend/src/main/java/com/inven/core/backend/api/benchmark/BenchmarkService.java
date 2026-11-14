package com.inven.core.backend.api.benchmark;

import static com.inven.core.backend.api.benchmark.BenchmarkResult.*;

import com.inven.core.backend.api.benchmark.mapper.BenchmarkMapper;
import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.LongSupplier;
import java.util.stream.LongStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BenchmarkService {

    private static final int WARMUPS = 2;
    private static final int REPETITIONS = 5;
    private static final int QUERY_BATCH = 8;
    private static final String QUERY =
        "SELECT COALESCE(SUM(amount), 0) FROM %s WHERE account_id = ? AND state = ?";
    private final BenchmarkMapper mapper;
    private final int rows;
    private final ForkJoinPool workers;
    private final ReentrantLock runLock = new ReentrantLock();
    private volatile boolean ready;
    private List<Long> inputs;
    private double seedMillis;
    private String database = "PostgreSQL";

    /**
     * 측정 행 수를 검증하고 CPU 수에 맞춘 전용 ForkJoinPool을 생성합니다.
     */
    public BenchmarkService(BenchmarkMapper mapper, @Value("${benchmark.rows:300000}") int rows) {
        if (rows < 1000 || rows > 1000000) {
            throw new IllegalArgumentException("benchmark.rows must be 1000..1000000");
        }
        this.mapper = mapper;
        this.rows = rows;
        this.workers = new ForkJoinPool(
            Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors()))
        );
    }

    /**
     * 비교 데이터 준비입니다. MyBatis Mapper XML로 테이블 생성 → 행 수 확인 → 데이터 생성·복제 →
     * 복합 인덱스 생성·통계 갱신 → 숫자 목록 구성 → 준비 상태 공개
     */
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
        database = mapper.databaseVersion();
        seedMillis = (System.nanoTime() - started) / 1_000_000.0;
        ready = true;
    }

    /**
     * 실험 환경 조회입니다. 데이터 준비 여부·행 수·논리 CPU·전용 풀 작업자 수·Java·PostgreSQL 버전을
     * Status.builder()로 조립해 반환
     */
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

    /**
     * 동시 실행 제어입니다. 초기화 완료 여부 확인 → 서버 프로세스 공용 ReentrantLock 획득 시도
     */
    public boolean tryAcquire() {
        return ready && runLock.tryLock();
    }

    /**
     * 실험 잠금 해제입니다. 컨트롤러의 finally에서 잠금을 반환해 다음 측정을 허용
     */
    public void release() {
        runLock.unlock();
    }

    // 대기·공유 상태 변경·DB 접근 없이 같은 입력에 같은 결과를 내는 CPU 작업입니다.

    /**
     * 동일 CPU 연산입니다. 입력 숫자마다 64회 비트 변환·회전 수행 → 정수 범위로 마스킹. 두 방식 모두 같은 순수
     * 함수를 사용합니다.
     */
    public long score(long value) {
        long result = value;
        for (int round = 0; round < 64; round++) {
            result = (result ^ (result >>> 27)) * 0x3C79AC492BA7B653L;
            result = Long.rotateLeft(result, 17) ^ round;
        }
        return result & 0xFFFFF;
    }

    /**
     * 순차·병렬 스트림 비교입니다. 같은 목록의 stream()과 전용 ForkJoinPool 안의
     * parallelStream()에 동일 score·합계를 적용 → 공통 측정 함수 호출
     */
    public Comparison streams() {
        LongSupplier sequential = () -> inputs.stream().mapToLong(this::score).sum();
        LongSupplier parallel = () ->
            workers.submit(() -> inputs.parallelStream().mapToLong(this::score).sum()).join();
        return measure(
            "streams",
            "순차 스트림",
            "병렬 스트림",
            sequential,
            parallel,
            1,
            "",
            "",
            ""
        );
    }

    /**
     * 인덱스 비교입니다. 양쪽 EXPLAIN ANALYZE 수집 → 같은 조건의 집계 쿼리 배치를 공통 측정 함수로 비교
     */
    public Comparison indexes() {
        String baselinePlan = String.join("\n", mapper.explain(false, 100, 0));
        String optimizedPlan = String.join("\n", mapper.explain(true, 100, 0));
        return measure(
            "indexes",
            "복합 인덱스 없음",
            "복합 인덱스 적용",
            () -> queryBatch(false),
            () -> queryBatch(true),
            QUERY_BATCH,
            baselinePlan,
            optimizedPlan,
            QUERY.formatted("<동일 데이터 테이블>")
        );
    }

    /**
     * 고정 조회 부하입니다. 인덱스 유무를 Mapper에 전달 → XML의 고정 테이블 분기 → 8개 계정·상태 조건을
     * 바인딩해 조회 → 결과 합산
     */
    private long queryBatch(boolean indexed) {
        long checksum = 0;
        for (int i = 0; i < QUERY_BATCH; i++) {
            checksum += mapper.sumAmount(indexed, 100 + i * 997, i % 4);
        }
        return checksum;
    }

    /**
     * 공정한 반복 측정입니다. 사전 결과 비교 → 2회 워밍업 → 5회 실행 순서 교대 → 표본별 checksum 확인 →
     * 중앙값·시간 변화율 계산 → Comparison.builder()로 결과 조립
     */
    private Comparison measure(
        String kind,
        String before,
        String after,
        LongSupplier baseline,
        LongSupplier optimized,
        int operations,
        String beforePlan,
        String afterPlan,
        String sql
    ) {
        long expected = baseline.getAsLong();
        if (expected != optimized.getAsLong()) {
            throw new RuntimeException("비교 대상의 계산 결과가 다릅니다.");
        }
        for (int i = 0; i < WARMUPS; i++) {
            if (i % 2 == 0) {
                baseline.getAsLong();
                optimized.getAsLong();
            } else {
                optimized.getAsLong();
                baseline.getAsLong();
            }
        }
        List<Double> beforeTimes = new ArrayList<>();
        List<Double> afterTimes = new ArrayList<>();
        for (int i = 0; i < REPETITIONS; i++) {
            if (i % 2 == 0) {
                beforeTimes.add(time(baseline, expected));
                afterTimes.add(time(optimized, expected));
            } else {
                afterTimes.add(time(optimized, expected));
                beforeTimes.add(time(baseline, expected));
            }
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
            .changePercent(((left.medianMs() - right.medianMs()) / left.medianMs()) * 100)
            .baselinePlan(beforePlan)
            .optimizedPlan(afterPlan)
            .sql(sql)
            .environment(status())
            .build();
    }

    /**
     * 실행 시간 측정입니다. nanoTime 시작 → 실제 작업 및 결과 소비 → 경과 시간 기록 → 기대 checksum
     * 확인
     */
    private double time(LongSupplier work, long expected) {
        long started = System.nanoTime();
        long actual = work.getAsLong();
        long duration = System.nanoTime() - started;
        if (actual != expected) {
            throw new RuntimeException("측정 중 계산 결과가 변경되었습니다.");
        }
        return Math.max(1, duration) / 1_000_000.0;
    }

    /**
     * 측정값 요약입니다. 표본 정렬 → 중앙값·최소·최대 산출 → Measurement.builder()로 전체 표본과
     * checksum을 함께 조립
     */
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

    /**
     * 작업자 풀 종료입니다. 애플리케이션 종료 시 전용 ForkJoinPool 정리
     */
    @PreDestroy
    public void close() {
        workers.shutdown();
    }
}
