package com.inven.core.backend.api.orderlab;

import static com.inven.core.backend.api.orderlab.OrderLabDto.*;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import org.apache.kafka.clients.admin.*;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.GroupIdNotFoundException;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.core.*;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Service
@ConditionalOnProperty(prefix = "gw-sync", name = "mode", havingValue = "external")
public class OrderLabKafkaEngine implements OrderLabEngine {

    private final KafkaTemplate<String, String> kafka;
    private final KafkaAdmin kafkaAdmin;
    private final KafkaListenerEndpointRegistry registry;
    private final ObjectMapper json;
    private final String topic;
    private final Map<Group, OrderLabKafkaConsumer> listeners;

    /**
     * 전달받은 값으로 OrderLabKafkaEngine 인스턴스를 초기화합니다.
     */
    public OrderLabKafkaEngine(
        KafkaTemplate<String, String> kafka,
        KafkaAdmin kafkaAdmin,
        KafkaListenerEndpointRegistry registry,
        ObjectMapper json,
        @Value("${order-lab.topic}") String topic,
        @Qualifier("orderProcessingConsumer") OrderLabKafkaConsumer processing,
        @Qualifier("orderAuditConsumer") OrderLabKafkaConsumer audit
    ) {
        this.kafka = kafka;
        this.kafkaAdmin = kafkaAdmin;
        this.registry = registry;
        this.json = json;
        this.topic = topic;
        listeners = Map.of(Group.PROCESSING, processing, Group.AUDIT, audit);
    }

    /**
     * 주문 키와 목적 파티션을 지정해 Kafka에 전송하고 브로커의 확인 위치를 반환합니다.
     */
    @Override
    public Position publish(OrderLabEvent event) throws Exception {
        var metadata = kafka
            .send(
                new ProducerRecord<>(
                    topic,
                    event.getDestinationPartition(),
                    event.getOrderId(),
                    json.writeValueAsString(event.message())
                )
            )
            .get(10, TimeUnit.SECONDS)
            .getRecordMetadata();
        return new Position(metadata.partition(), metadata.offset());
    }

    /**
     * Kafka Admin API로 시작·끝·커밋 오프셋을 조회해 그룹별 지연을 계산합니다.
     */
    @Override
    public State state() {
        var config = new HashMap<String, Object>(kafkaAdmin.getConfigurationProperties());
        config.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, 3000);
        config.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, 2000);
        try (var admin = AdminClient.create(config)) {
            Map<TopicPartition, OffsetSpec> endRequest = new LinkedHashMap<>(),
                beginRequest = new LinkedHashMap<>();
            for (int p = 0; p < 3; p++) {
                var tp = new TopicPartition(topic, p);
                endRequest.put(tp, OffsetSpec.latest());
                beginRequest.put(tp, OffsetSpec.earliest());
            }
            var ends = admin.listOffsets(endRequest).all().get(3, TimeUnit.SECONDS);
            var beginnings = admin.listOffsets(beginRequest).all().get(3, TimeUnit.SECONDS);
            List<GroupState> groups = new ArrayList<>();
            for (Group group : Group.values()) {
                Map<TopicPartition, org.apache.kafka.clients.consumer.OffsetAndMetadata> offsets;
                try {
                    offsets = admin
                        .listConsumerGroupOffsets(listeners.get(group).getGroupId())
                        .partitionsToOffsetAndMetadata()
                        .get(3, TimeUnit.SECONDS);
                } catch (ExecutionException failure) {
                    if (failure.getCause() instanceof GroupIdNotFoundException) {
                        offsets = Map.of();
                    } else {
                        throw failure;
                    }
                }
                List<PartitionState> partitions = new ArrayList<>();
                for (var tp : endRequest.keySet()) {
                    Long committed =
                        offsets.containsKey(tp) && offsets.get(tp) != null
                            ? offsets.get(tp).offset()
                            : null;
                    long beginning = beginnings.get(tp).offset(),
                        end = ends.get(tp).offset();
                    partitions.add(
                        new PartitionState(
                            tp.partition(),
                            beginning,
                            end,
                            committed,
                            Math.max(0, end - (committed == null ? beginning : committed))
                        )
                    );
                }
                var container = registry.getListenerContainer(listeners.get(group).getListenerId());
                groups.add(
                    new GroupState(
                        group,
                        container.isContainerPaused(),
                        container.isPauseRequested(),
                        partitions
                    )
                );
            }
            return new State("EXTERNAL_KAFKA", topic, groups);
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Kafka 상태 조회가 중단되었습니다."
            );
        } catch (Exception failure) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Kafka 토픽이 준비 중이거나 오프셋을 읽을 수 없습니다. 잠시 후 다시 확인하세요.",
                failure
            );
        }
    }

    /**
     * 소비 그룹 제어입니다. 실습 전용 그룹만 일시정지·재개·같은 그룹으로 재시작·처음부터 재처리. 재처리는 실제 일시정지
     * 확인 후 허용
     */
    @Override
    public synchronized void control(Group group, String action) {
        var listener = listeners.get(group);
        var container = registry.getListenerContainer(listener.getListenerId());
        switch (action) {
            case "pause" -> container.pause();
            case "resume" -> container.resume();
            case "restart" -> {
                container.stop();
                container.resume();
                container.start();
            }
            case "replay" -> {
                if (!container.isContainerPaused()) {
                    throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "실제 일시정지 상태가 된 뒤 재처리하세요."
                    );
                }
                listener.replayBeginning();
            }
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "지원하지 않는 그룹 명령입니다."
            );
        }
    }

    /**
     * 현재 주문 위치로 되감기입니다. 소비 그룹의 실제 일시정지 확인 → 해당 주문이 있는 파티션만 시작 offset으로
     * 이동 → 재개 시 그 위치부터 읽음
     */
    @Override
    public synchronized void replayFrom(Group group, Map<Integer, Long> offsets) {
        var listener = listeners.get(group);
        if (!registry.getListenerContainer(listener.getListenerId()).isContainerPaused()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "작업자가 쉬는 상태에서 되감아 주세요."
            );
        }
        listener.replayOffsets(offsets);
    }
}
