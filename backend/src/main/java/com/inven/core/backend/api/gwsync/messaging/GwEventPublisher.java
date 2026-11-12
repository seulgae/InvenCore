package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.service.GwSourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.util.concurrent.TimeUnit;

@Component @RequiredArgsConstructor @Slf4j
@ConditionalOnExpression("${gw-sync.enabled:true} && '${gw-sync.mode:local}'.equalsIgnoreCase('external')")
public class GwEventPublisher {
    private final GwSourceService sources;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper json;
    private final GwSyncProperties properties;

    // Pending revision is committed with the source row. A crash after Kafka ack may cause a duplicate.
    @Scheduled(fixedDelayString = "${gw-sync.publish-delay-ms:1000}")
    public void publishPending() {
        for (var event : sources.pending()) {
            try {
                kafka.send(properties.getTopic(), event.id(), json.writeValueAsString(event)).get(10, TimeUnit.SECONDS);
                sources.confirmPublished(event.id(), event.revision());
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception failure) {
                log.warn("GW Kafka 발행 실패 · 다음 주기에 재시도: {} revision={}", event.id(), event.revision());
                return;
            }
        }
    }
}
