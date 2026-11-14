package com.inven.core.backend.api.orderlab;

import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import lombok.Getter;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.listener.AbstractConsumerSeekAware;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

public class OrderLabKafkaConsumer extends AbstractConsumerSeekAware {

    @Getter
    private final String listenerId;

    @Getter
    private final String groupId;

    private final OrderLabDto.Group group;
    private final OrderLabStore store;
    private final ObjectMapper json;
    private final OrderLabPractice practice;

    /**
     * 전달받은 값으로 OrderLabKafkaConsumer 인스턴스를 초기화합니다.
     */
    public OrderLabKafkaConsumer(
        OrderLabDto.Group group,
        OrderLabStore store,
        ObjectMapper json,
        OrderLabPractice practice
    ) {
        this.group = group;
        this.store = store;
        this.json = json;
        this.practice = practice;
        listenerId = "order-lab-" + group.name().toLowerCase();
        groupId = "invencore-" + listenerId + "-v1";
    }

    /**
     * Kafka 주문 이벤트 수신입니다. JSON 매핑·키 검증 → 모드별 다음 offset 계산 → 공통 JPA 반영 →
     * REFERENCE는 acknowledge, LEARNER는 계산한 위치로 commitSync. 주문 전용
     * MANUAL_IMMEDIATE 설정 사용
     */
    @KafkaListener(
        id = "#{__listener.listenerId}",
        groupId = "#{__listener.groupId}",
        topics = "${order-lab.topic}",
        concurrency = "3",
        autoStartup = "false",
        containerFactory = "orderLabListenerFactory"
    )
    public void acceptOrder(
        ConsumerRecord<String, String> record,
        Acknowledgment acknowledgment,
        Consumer<String, String> consumer
    ) {
        var message = json.readValue(record.value(), OrderLabDto.Message.class);
        if (
            message == null ||
            message.orderId() == null ||
            !message.orderId().equals(record.key()) ||
            message.sequence() < 1 ||
            message.sequence() > 4
        ) {
            throw new IllegalArgumentException("주문 이벤트 형식이 올바르지 않습니다.");
        }
        long next = practice.nextOffset(message.learner(), record.offset());
        store.consume(message, group, record.partition(), record.offset());
        if (message.learner()) {
            consumer.commitSync(
                java.util.Map.of(
                    new TopicPartition(record.topic(), record.partition()),
                    new OffsetAndMetadata(next)
                )
            );
        } else {
            acknowledgment.acknowledge();
        }
    }

    /**
     * 파티션 시작으로 seek입니다. 해당 소비 그룹에 할당된 파티션의 시작 오프셋으로 seek 요청. 다른 그룹의 위치는
     * 바꾸지 않습니다.
     */
    public void replayBeginning() {
        requireAssignments();
        seekToBeginning();
    }

    /** 정지 요청과 파티션 재할당 완료는 별개입니다. 세 파티션의 seek 콜백 준비를 확인합니다. */
    public boolean hasAssignments(String topic, int partitions) {
        var callbacks = getTopicsAndCallbacks();
        for (int partition = 0; partition < partitions; partition++) {
            var assigned = callbacks.get(new TopicPartition(topic, partition));
            if (assigned == null || assigned.isEmpty()) return false;
        }
        return true;
    }

    private void requireAssignments() {
        if (getTopicsAndCallbacks().isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Kafka 파티션 할당이 준비 중입니다. 잠시 후 다시 시도하세요."
            );
        }
    }

    /**
     * 미션 시작 위치 선택입니다. 실행의 발행 완료 이벤트에서 파티션별 최소 offset을 구함 → 해당 파티션 콜백에
     * seek 요청. 이전 실행 전체를 되감지 않습니다.
     */
    public void replayOffsets(java.util.Map<Integer, Long> offsets) {
        requireAssignments();
        getTopicsAndCallbacks().forEach((partition, callbacks) -> {
            Long offset = offsets.get(partition.partition());
            if (offset != null) {
                callbacks.forEach(callback ->
                    callback.seek(partition.topic(), partition.partition(), offset)
                );
            }
        });
    }
}
