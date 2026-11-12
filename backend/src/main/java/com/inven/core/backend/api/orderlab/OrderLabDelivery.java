package com.inven.core.backend.api.orderlab;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="order_lab_delivery") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class OrderLabDelivery {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=36) private String runId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private OrderLabDto.Group consumerGroup;
    @Column(nullable=false,length=60) private String orderId;
    private int eventSequence;
    @Column(nullable=false,length=20) private String status;
    private int partitionNumber;
    private long recordOffset;
    @Column(nullable=false,length=30) private String outcome;
    @Column(nullable=false,length=150) private String worker;
    private Instant receivedAt;
    @Builder
    public OrderLabDelivery(OrderLabDto.Message message, OrderLabDto.Group group, int partition, long offset, String outcome) {
        runId=message.runId(); consumerGroup=group; orderId=message.orderId(); eventSequence=message.sequence();
        status=message.status(); partitionNumber=partition; recordOffset=offset; this.outcome=outcome;
        worker=Thread.currentThread().getName(); receivedAt=Instant.now();
    }
    public OrderLabDto.Receipt view() { return new OrderLabDto.Receipt(id,consumerGroup,orderId,eventSequence,status,partitionNumber,recordOffset,outcome,worker,receivedAt); }
}
