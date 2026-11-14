package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.service.GwProjectionService;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@ConditionalOnExpression(
    "${gw-sync.enabled:true} && '${gw-sync.mode:external}'.equalsIgnoreCase('external')"
)
public class GwEventListener {

    private final GwProjectionService projection;
    private final ObjectMapper json;

    /**
     * Kafka 메시지 수신입니다. JSON → GwChangedEvent 매핑 → 스키마·입력값·key 검증 → JPA
     * 대상 반영. 예외는 재시도 후 .DLT로 이동
     */
    @KafkaListener(
        id = "gw-sync-listener",
        topics = "${gw-sync.topic}",
        groupId = "${gw-sync.group-id}",
        autoStartup = "false"
    )
    public void receive(ConsumerRecord<String, String> record) {
        GwChangedEvent event = json.readValue(record.value(), GwChangedEvent.class);
        event.validate();
        if (!event.id().equals(record.key())) {
            throw new IllegalArgumentException("Kafka key와 원본 ID가 다릅니다.");
        }
        projection.project(event);
    }
}
