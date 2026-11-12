package com.inven.core.backend.api.orderlab;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderLabDeliveryRepository extends JpaRepository<OrderLabDelivery,Long> {
    List<OrderLabDelivery> findTop240ByRunIdOrderByIdDesc(String runId);
}
