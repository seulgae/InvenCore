package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.service.GwSourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @Slf4j
@ConditionalOnExpression("${gw-sync.enabled:true} && '${gw-sync.mode:local}'.equalsIgnoreCase('local')")
public class GwLocalEventPublisher {
    private final GwSourceService sources;
    private final ApplicationEventPublisher events;

    // Runs outside the request transaction, using committed pending rows just like the Kafka publisher.
    @Scheduled(fixedDelayString = "${gw-sync.publish-delay-ms:1000}")
    public void dispatchPending() {
        for (var event : sources.pending()) {
            try {
                events.publishEvent(event);
                sources.confirmPublished(event.id(), event.revision());
            } catch (RuntimeException failure) {
                log.warn("GW 로컬 이벤트 처리 실패 · 다음 주기에 재시도: {} revision={}", event.id(), event.revision());
                return;
            }
        }
    }
}
