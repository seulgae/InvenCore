package com.inven.core.backend.api.benchmark.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface BenchmarkMapper {
    /**
     * 비교 테이블 생성입니다. XML의 indexed 분기로 고정된 테이블 선택 → 동일 스키마 생성
     */
    void createTable(@Param("indexed") boolean indexed);

    /**
     * 데이터 수 확인입니다. COUNT(*)로 현재 행 수 조회 → 재생성 필요 여부 판단
     */
    long countRows(@Param("indexed") boolean indexed);

    /**
     * 실험 데이터 초기화입니다. 크기를 변경할 때 실험 전용 테이블 데이터만 삭제
     */
    void clearTable(@Param("indexed") boolean indexed);

    /**
     * 결정적 데이터 생성입니다. 행 수를 바인딩해 generate_series로 같은 규칙의 데이터 생성
     */
    void seedPlain(@Param("rows") int rows);

    /**
     * 동일 데이터 복제입니다. 기준 테이블의 모든 행을 인덱스 비교 테이블로 복제
     */
    void copyIndexed();

    /**
     * 복합 인덱스 생성입니다. bench_indexed에만 (account_id, state) 복합 인덱스 생성
     */
    void createIndex();

    /**
     * 통계 갱신입니다. ANALYZE로 옵티마이저 통계 갱신
     */
    void analyze(@Param("indexed") boolean indexed);

    /**
     * DB 버전 조회입니다. version() 결과를 측정 환경 정보에 표시
     */
    String databaseVersion();

    /**
     * 동일 조건 집계입니다. 고정 테이블 분기 → accountId·state 바인딩 → SUM(amount) 반환.
     * MyBatis 결과 캐시 미사용
     */
    long sumAmount(
        @Param("indexed") boolean indexed,
        @Param("accountId") int accountId,
        @Param("state") int state
    );

    /**
     * 실제 실행 계획 조회입니다. 동일 집계 SQL에 EXPLAIN ANALYZE 적용 → 인덱스·스캔 수 확인
     */
    java.util.List<String> explain(
        @Param("indexed") boolean indexed,
        @Param("accountId") int accountId,
        @Param("state") int state
    );
}
