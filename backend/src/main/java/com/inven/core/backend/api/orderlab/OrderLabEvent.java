package com.inven.core.backend.api.orderlab;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "order_lab_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderLabEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String eventId;

    @Column(nullable = false, length = 36)
    private String runId;

    @Column(nullable = false, length = 60)
    private String orderId;

    private int eventSequence;

    @Column(nullable = false, length = 20)
    private String status;

    private int destinationPartition;

    @Column(nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    private boolean learner;

    private Integer brokerPartition;
    private Long brokerOffset;

    /**
     * 전달받은 값으로 OrderLabEvent 인스턴스를 초기화합니다.
     */
    @Builder
    public OrderLabEvent(
        String runId,
        String orderId,
        int sequence,
        String status,
        int partition,
        boolean learner
    ) {
        this.eventId = UUID.randomUUID().toString();
        this.runId = runId;
        this.orderId = orderId;
        this.eventSequence = sequence;
        this.status = status;
        this.destinationPartition = partition;
        this.learner = learner;
    }

    /**
     * 저장한 주문 이벤트를 Kafka 또는 로컬 엔진에 전달할 메시지로 변환합니다.
     */
    public OrderLabDto.Message message() {
        return new OrderLabDto.Message(eventId, runId, orderId, eventSequence, status, learner);
    }

    /**
     * 브로커가 확인한 파티션과 오프셋을 이벤트 행에 기록합니다.
     */
    public void confirm(OrderLabDto.Position position) {
        brokerPartition = position.partition();
        brokerOffset = position.offset();
    }
}
