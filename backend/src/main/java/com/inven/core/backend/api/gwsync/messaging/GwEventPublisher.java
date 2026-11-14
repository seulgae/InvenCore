package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.service.GwSourceService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnExpression(
    "${gw-sync.enabled:true} && '${gw-sync.mode:external}'.equalsIgnoreCase('external')"
)
public class GwEventPublisher {

    private final GwSourceService sources;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper json;
    private final GwSyncProperties properties;

    // 발행 대기 revision은 원본과 함께 커밋합니다. Kafka 확인 직후 장애가 나면 중복 발행될 수 있습니다.

    /**
     * Kafka 이벤트 발행입니다. 커밋된 대기 데이터 조회 → ID를 key로 JSON 발행 → broker ack 대기
     * → 발행 버전 갱신. 실패 시 다음 주기 재시도
     */
    @Scheduled(fixedDelayString = "${gw-sync.publish-delay-ms:1000}")
    public void publishPending() {
        for (var event : sources.pending()) {
            try {
                kafka
                    .send(properties.getTopic(), event.id(), json.writeValueAsString(event))
                    .get(10, TimeUnit.SECONDS);
                sources.confirmPublished(event.id(), event.revision());
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception failure) {
                log.warn(
                    "GW Kafka 발행 실패 · 다음 주기에 재시도: {} revision={}",
                    event.id(),
                    event.revision()
                );
                return;
            }
        }
    }
}
