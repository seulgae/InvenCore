package com.inven.core.backend.api.practice;

import java.util.List;
import java.util.function.LongUnaryOperator;
import org.springframework.stereotype.Component;

/** 독립 카드 실습. docs/INVENTORY_PRACTICE.md 참고. */
@Component
public class UserParallelCode {
    /** TODO: work 적용 결과를 long으로 합산. parallel=true이면 parallelStream 사용.
     * 빈 목록은 0. 공유 가변 누적 변수 없이 reduction을 사용하세요. work는 순수 함수입니다. */
    public long aggregate(List<Long> values, boolean parallel, LongUnaryOperator work) {
        throw new UnsupportedOperationException("TODO · aggregate");
    }
}
