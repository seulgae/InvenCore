package com.inven.core.backend.api.orderlab;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLabDeliveryRepository extends JpaRepository<OrderLabDelivery, Long> {
    /**
     * 실행별 최근 전달 기록을 최대 240개 조회합니다.
     */
    List<OrderLabDelivery> findTop240ByRunIdOrderByIdDesc(String runId);
}
