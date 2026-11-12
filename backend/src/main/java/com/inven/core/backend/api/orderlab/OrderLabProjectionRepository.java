package com.inven.core.backend.api.orderlab;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderLabProjectionRepository extends JpaRepository<OrderLabProjection,String> {
    List<OrderLabProjection> findByRunIdOrderByOrderIdAsc(String runId);
}
