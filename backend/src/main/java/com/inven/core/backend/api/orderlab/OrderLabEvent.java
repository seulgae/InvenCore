package com.inven.core.backend.api.orderlab;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name="order_lab_event") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class OrderLabEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=36) private String eventId;
    @Column(nullable=false, length=36) private String runId;
    @Column(nullable=false, length=60) private String orderId;
    private int eventSequence;
    @Column(nullable=false, length=20) private String status;
    private int destinationPartition;
    @Column(nullable=false) @org.hibernate.annotations.ColumnDefault("false") private boolean learner;
    private Integer brokerPartition;
    private Long brokerOffset;
    @Builder
    public OrderLabEvent(String runId, String orderId, int sequence, String status, int partition, boolean learner) {
        this.eventId=UUID.randomUUID().toString(); this.runId=runId; this.orderId=orderId;
        this.eventSequence=sequence; this.status=status; this.destinationPartition=partition;
        this.learner=learner;
    }
    public OrderLabDto.Message message() { return new OrderLabDto.Message(eventId,runId,orderId,eventSequence,status,learner); }
    public void confirm(OrderLabDto.Position position) { brokerPartition=position.partition(); brokerOffset=position.offset(); }
}
