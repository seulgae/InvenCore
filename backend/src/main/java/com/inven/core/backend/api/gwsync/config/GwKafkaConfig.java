package com.inven.core.backend.api.gwsync.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.*;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnExpression(
    "${gw-sync.enabled:true} && '${gw-sync.mode:external}'.equalsIgnoreCase('external')"
)
public class GwKafkaConfig {

    /**
     * 외부 모드 시작입니다. Kafka 토픽·DLT 명시적 생성 확인 → GW Kafka 리스너 시작. local
     * 모드에서는 이 설정 클래스가 등록되지 않습니다.
     */
    @Bean
    public ApplicationRunner startGwKafka(
        KafkaAdmin admin,
        KafkaListenerEndpointRegistry registry,
        GwSyncProperties properties
    ) {
        return args -> {
            admin.createOrModifyTopics(gwTopic(properties), gwDeadLetterTopic(properties));
            registry.getListenerContainer("gw-sync-listener").start();
        };
    }

    /**
     * GW 변경 이벤트를 전달할 Kafka 토픽을 구성합니다.
     */
    @Bean
    public NewTopic gwTopic(GwSyncProperties properties) {
        return TopicBuilder.name(properties.getTopic()).partitions(3).replicas(1).build();
    }

    /**
     * 재시도를 소진한 GW 이벤트를 보관할 DLT를 구성합니다.
     */
    @Bean
    public NewTopic gwDeadLetterTopic(GwSyncProperties properties) {
        return TopicBuilder.name(properties.getTopic() + ".DLT")
            .partitions(3)
            .replicas(1)
            .build();
    }

    /**
     * GW 이벤트 처리의 재시도 간격과 DLT 전송 정책을 구성합니다.
     */
    @Bean
    public DefaultErrorHandler gwErrorHandler(KafkaTemplate<String, String> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template, (record, failure) ->
            new TopicPartition(record.topic() + ".DLT", record.partition())
        );
        recoverer.setFailIfSendResultIsError(true);
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000, 2));
    }
}
