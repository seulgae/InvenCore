package com.inven.core.backend.api.orderlab;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface OrderLabEventRepository extends JpaRepository<OrderLabEvent, Long> {
    @Query("select coalesce(max(e.brokerOffset), -1) + 1 from OrderLabEvent e where e.brokerPartition=:partition")
    long nextLocalOffset(@Param("partition") int partition);

    /**
     * 아직 발행 위치가 없는 주문 이벤트를 생성 순으로 최대 30개 조회합니다.
     */
    List<OrderLabEvent> findTop30ByBrokerOffsetIsNullOrderByIdAsc();

    /**
     * 실행에 속한 주문 이벤트를 생성 순서대로 조회합니다.
     */
    List<OrderLabEvent> findByRunIdOrderByIdAsc(String runId);

    /**
     * 같은 주문의 상태 반영이 겹치지 않도록 해당 주문의 기준 이벤트 행을 잠급니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select e from OrderLabEvent e where e.runId=:runId and e.orderId=:orderId and e.eventSequence=1"
    )
    Optional<OrderLabEvent> lockOrder(
        @Param("runId") String runId,
        @Param("orderId") String orderId
    );

    /**
     * 지정한 파티션과 시작 오프셋부터 로컬 이벤트 로그를 순서대로 조회합니다.
     */
    @Query(
        "select e from OrderLabEvent e where e.brokerPartition=:partition and e.brokerOffset>=:offset order by e.brokerOffset"
    )
    List<OrderLabEvent> records(
        @Param("partition") int partition,
        @Param("offset") long offset,
        Pageable pageable
    );
}
