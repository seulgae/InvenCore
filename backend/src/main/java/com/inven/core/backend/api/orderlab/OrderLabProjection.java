package com.inven.core.backend.api.orderlab;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="order_lab_projection") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class OrderLabProjection {
    @Id @Column(length=100) private String id;
    @Column(nullable=false,length=36) private String runId;
    @Column(nullable=false,length=60) private String orderId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private OrderLabDto.Group consumerGroup;
    private int lastSequence;
    @Column(nullable=false,length=20) private String status="NONE";
    @Builder
    public OrderLabProjection(String runId, String orderId, OrderLabDto.Group group) {
        this.id=group+":"+orderId; this.runId=runId; this.orderId=orderId; consumerGroup=group;
    }
    public String apply(OrderLabDto.Message message,boolean allowed) {
        if(!allowed) return message.sequence()<=lastSequence ? message.sequence()==lastSequence ? "DUPLICATE" : "STALE" : "REJECTED";
        String outcome=message.sequence()==lastSequence+1 ? "APPLIED" : "APPLIED_WITH_GAP";
        lastSequence=message.sequence(); status=message.status(); return outcome;
    }
    public OrderLabDto.Projection view() { return new OrderLabDto.Projection(consumerGroup,orderId,lastSequence,status); }
}
