package com.inven.core.backend.api.orderlab;

import lombok.Getter;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.listener.AbstractConsumerSeekAware;
import tools.jackson.databind.ObjectMapper;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import org.springframework.kafka.support.Acknowledgment;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;

public class OrderLabKafkaConsumer extends AbstractConsumerSeekAware {
    @Getter private final String listenerId;
    @Getter private final String groupId;
    private final OrderLabDto.Group group;
    private final OrderLabStore store;
    private final ObjectMapper json;
    private final OrderLabPractice practice;
    public OrderLabKafkaConsumer(OrderLabDto.Group group,OrderLabStore store,ObjectMapper json,OrderLabPractice practice) {
        this.group=group; this.store=store; this.json=json;
        this.practice=practice;
        listenerId="order-lab-"+group.name().toLowerCase(); groupId="invencore-"+listenerId+"-v1";
    }
    @KafkaListener(id="#{__listener.listenerId}",groupId="#{__listener.groupId}",
            topics="${order-lab.topic}",concurrency="3",autoStartup="false",containerFactory="orderLabListenerFactory")
    public void acceptOrder(ConsumerRecord<String,String> record,Acknowledgment acknowledgment,Consumer<String,String> consumer) {
        var message=json.readValue(record.value(),OrderLabDto.Message.class);
        if(message==null || message.orderId()==null || !message.orderId().equals(record.key()) || message.sequence()<1 || message.sequence()>4)
            throw new IllegalArgumentException("주문 이벤트 형식이 올바르지 않습니다.");
        long next=practice.nextOffset(message.learner(),record.offset());
        store.consume(message,group,record.partition(),record.offset());
        if(message.learner()) consumer.commitSync(java.util.Map.of(new TopicPartition(record.topic(),record.partition()),new OffsetAndMetadata(next)));
        else acknowledgment.acknowledge();
    }
    public void replayBeginning() { seekToBeginning(); }
    public void replayOffsets(java.util.Map<Integer,Long> offsets) {
        getTopicsAndCallbacks().forEach((partition,callbacks)-> {
            Long offset=offsets.get(partition.partition());
            if(offset!=null) callbacks.forEach(callback->callback.seek(partition.topic(),partition.partition(),offset));
        });
    }
}
