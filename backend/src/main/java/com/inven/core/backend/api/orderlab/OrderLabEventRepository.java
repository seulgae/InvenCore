package com.inven.core.backend.api.orderlab;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface OrderLabEventRepository extends JpaRepository<OrderLabEvent,Long> {
    List<OrderLabEvent> findTop30ByBrokerOffsetIsNullOrderByIdAsc();
    List<OrderLabEvent> findByRunIdOrderByIdAsc(String runId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from OrderLabEvent e where e.runId=:runId and e.orderId=:orderId and e.eventSequence=1")
    Optional<OrderLabEvent> lockOrder(@Param("runId") String runId,@Param("orderId") String orderId);
    @Query("select e from OrderLabEvent e where e.brokerPartition=:partition and e.brokerOffset>=:offset order by e.brokerOffset")
    List<OrderLabEvent> records(@Param("partition") int partition,@Param("offset") long offset,Pageable pageable);
}
