package com.inven.core.backend.api.orderlab.practice;

import com.inven.core.backend.api.orderlab.OrderLabDto.Routing;
import org.springframework.stereotype.Component;

/**
 * 직접 작성하는 Kafka 학습 코드. 이 파일의 TODO 세 곳을 구현하세요.
 * 기본 REFERENCE 게임은 영향받지 않습니다. LEARNER 게임에서 이 메서드를 호출합니다.
 * 설명과 실행 명령: docs/KAFKA_PRACTICE.md
 */
@Component
public class UserKafkaCode {
    /**
     * TODO 1: 0 이상 partitions 미만의 파티션 번호를 반환하세요.
     * KEYED: 같은 orderId의 모든 sequence는 같은 파티션. 서로 다른 주문은 분산하세요.
     * SPREAD: sequence 1,2,3,4를 파티션 0,1,2,0으로 보내세요 (partitions=3일 때).
     * 힌트: 나머지 연산, Math.floorMod, String.hashCode 또는 Kafka Utils.murmur2.
     */
    public int selectPartition(String orderId, int sequence, int partitions, Routing routing) {
        throw new UnsupportedOperationException("TODO 1 · selectPartition을 구현하세요.");
    }

    /**
     * TODO 2: 처리한 레코드 다음에 읽어야 할 오프셋을 반환하세요.
     * 입력은 0 이상 Long.MAX_VALUE 미만입니다. 오프셋 41을 처리했다면 무엇을 커밋할까요?
     * 힌트: Kafka committed offset은 마지막 처리 번호가 아닙니다.
     */
    public long nextOffset(long processedOffset) {
        throw new UnsupportedOperationException("TODO 2 · nextOffset을 구현하세요.");
    }

    /**
     * TODO 3: incomingSequence를 반영해야 할 때만 true를 반환하세요.
     * 같은 버전 재전달과 더 오래된 버전은 무시하고, 새로운 버전은 반영하세요.
     * 힌트: 여기서는 업무 버전(sequence)을 비교합니다. Kafka offset과 구분하세요.
     */
    public boolean shouldApply(long storedSequence, long incomingSequence) {
        throw new UnsupportedOperationException("TODO 3 · shouldApply를 구현하세요.");
    }
}
