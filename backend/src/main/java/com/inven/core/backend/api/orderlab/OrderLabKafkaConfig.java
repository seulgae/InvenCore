package com.inven.core.backend.api.orderlab;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.kafka.config.*;
import org.springframework.kafka.core.KafkaAdmin;
import tools.jackson.databind.ObjectMapper;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.apache.kafka.common.TopicPartition;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnProperty(prefix="gw-sync",name="mode",havingValue="external")
public class OrderLabKafkaConfig {
    @Bean public OrderLabKafkaConsumer orderProcessingConsumer(OrderLabStore store,ObjectMapper json,OrderLabPractice practice) {
        return new OrderLabKafkaConsumer(OrderLabDto.Group.PROCESSING,store,json,practice);
    }
    @Bean public OrderLabKafkaConsumer orderAuditConsumer(OrderLabStore store,ObjectMapper json,OrderLabPractice practice) {
        return new OrderLabKafkaConsumer(OrderLabDto.Group.AUDIT,store,json,practice);
    }
    @Bean public ConcurrentKafkaListenerContainerFactory<Object,Object> orderLabListenerFactory(
            ConsumerFactory<Object,Object> consumerFactory,KafkaTemplate<String,String> template) {
        var factory=new ConcurrentKafkaListenerContainerFactory<Object,Object>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        var recoverer=new DeadLetterPublishingRecoverer(template,(record,failure)->new TopicPartition(record.topic()+".DLT",record.partition()));
        recoverer.setFailIfSendResultIsError(true);
        var handler=new DefaultErrorHandler(recoverer,new FixedBackOff(1000,2));
        handler.setCommitRecovered(true);
        factory.setCommonErrorHandler(handler);
        return factory;
    }
    @Bean public ApplicationRunner startOrderLabKafka(KafkaAdmin admin,KafkaListenerEndpointRegistry registry,
            GwSyncProperties properties,@Value("${order-lab.topic}") String topic) {
        return args->{
            if(!properties.isEnabled()) return;
            admin.createOrModifyTopics(TopicBuilder.name(topic).partitions(3).replicas(1).build(),
                    TopicBuilder.name(topic+".DLT").partitions(3).replicas(1).build());
            registry.getListenerContainer("order-lab-processing").start();
            registry.getListenerContainer("order-lab-audit").start();
        };
    }
}
