package com.inven.core.backend.api.orderlab;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_lab_projection")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderLabProjection {

    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, length = 36)
    private String runId;

    @Column(nullable = false, length = 60)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderLabDto.Group consumerGroup;

    private int lastSequence;

    @Column(nullable = false, length = 20)
    private String status = "NONE";

    /**
     * 전달받은 값으로 OrderLabProjection 인스턴스를 초기화합니다.
     */
    @Builder
    public OrderLabProjection(String runId, String orderId, OrderLabDto.Group group) {
        this.id = group + ":" + orderId;
        this.runId = runId;
        this.orderId = orderId;
        consumerGroup = group;
    }

    /**
     * 중복·과거 버전과 단계 누락을 판별하고 반영 가능한 주문 상태를 갱신합니다.
     */
    public String apply(OrderLabDto.Message message, boolean allowed) {
        if (!allowed) {
            return message.sequence() <= lastSequence
                ? message.sequence() == lastSequence
                    ? "DUPLICATE"
                    : "STALE"
                : "REJECTED";
        }
        String outcome = message.sequence() == lastSequence + 1 ? "APPLIED" : "APPLIED_WITH_GAP";
        lastSequence = message.sequence();
        status = message.status();
        return outcome;
    }

    /**
     * 그룹별 주문의 최신 상태와 버전을 조회 DTO로 변환합니다.
     */
    public OrderLabDto.Projection view() {
        return new OrderLabDto.Projection(consumerGroup, orderId, lastSequence, status);
    }
}
