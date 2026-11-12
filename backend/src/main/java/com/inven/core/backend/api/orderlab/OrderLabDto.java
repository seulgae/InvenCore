package com.inven.core.backend.api.orderlab;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class OrderLabDto {

    /**
     * 외부에서 인스턴스를 생성하지 않도록 기본 생성자를 제한합니다.
     */
    private OrderLabDto() {}

    public enum Group {
        PROCESSING,
        AUDIT,
    }

    public enum Routing {
        KEYED,
        SPREAD,
    }

    public enum Implementation {
        REFERENCE,
        LEARNER,
    }

    public record Start(
        @NotNull Routing routing,
        @Min(1) @Max(6) int orders,
        Implementation implementation
    ) {
        /**
         * 구현 모드를 생략하면 기준 구현 모드를 사용합니다.
         */
        public Start {
            if (implementation == null) {
                implementation = Implementation.REFERENCE;
            }
        }

        /**
         * 기존 두 인자 요청을 기준 구현 모드의 시작 옵션으로 변환합니다.
         */
        public Start(Routing routing, int orders) {
            this(routing, orders, Implementation.REFERENCE);
        }
    }

    public record Run(String runId, Routing routing, int events, Implementation implementation) {}

    public record Message(
        String eventId,
        String runId,
        String orderId,
        int sequence,
        String status,
        boolean learner
    ) {}

    public record Position(int partition, long offset) {}

    public record PartitionState(
        int partition,
        long beginningOffset,
        long endOffset,
        Long committedOffset,
        long lag
    ) {}

    public record GroupState(
        Group group,
        boolean paused,
        boolean pauseRequested,
        List<PartitionState> partitions
    ) {}

    public record State(String mode, String topic, List<GroupState> groups) {}

    public record Receipt(
        long id,
        Group group,
        String orderId,
        int sequence,
        String status,
        int partition,
        long offset,
        String outcome,
        String worker,
        Instant receivedAt
    ) {}

    public record Projection(Group group, String orderId, int sequence, String status) {}

    public record RunView(
        String runId,
        long published,
        List<Receipt> deliveries,
        List<Projection> projections
    ) {}
}
