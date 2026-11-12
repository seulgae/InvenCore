package com.inven.core.backend.api.gwsync.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.*;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnExpression("${gw-sync.enabled:true} && '${gw-sync.mode:local}'.equalsIgnoreCase('external')")
public class GwKafkaConfig {
    @Bean public ApplicationRunner startGwKafka(KafkaAdmin admin, KafkaListenerEndpointRegistry registry, GwSyncProperties properties) {
        return args -> {
            admin.createOrModifyTopics(gwTopic(properties), gwDeadLetterTopic(properties));
            registry.getListenerContainer("gw-sync-listener").start();
        };
    }
    @Bean public NewTopic gwTopic(GwSyncProperties properties) {
        return TopicBuilder.name(properties.getTopic()).partitions(3).replicas(1).build();
    }
    @Bean public NewTopic gwDeadLetterTopic(GwSyncProperties properties) {
        return TopicBuilder.name(properties.getTopic() + ".DLT").partitions(3).replicas(1).build();
    }
    @Bean public DefaultErrorHandler gwErrorHandler(KafkaTemplate<String, String> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template,
                (record, failure) -> new TopicPartition(record.topic() + ".DLT", record.partition()));
        recoverer.setFailIfSendResultIsError(true);
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000, 2));
    }
}
