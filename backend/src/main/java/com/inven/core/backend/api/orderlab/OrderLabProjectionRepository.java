package com.inven.core.backend.api.orderlab;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLabProjectionRepository extends JpaRepository<OrderLabProjection, String> {
    /**
     * 실행별 주문 상태를 주문 ID 순서대로 조회합니다.
     */
    List<OrderLabProjection> findByRunIdOrderByOrderIdAsc(String runId);
}
