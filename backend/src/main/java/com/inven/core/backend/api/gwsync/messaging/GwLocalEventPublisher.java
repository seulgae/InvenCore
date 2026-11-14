package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.service.GwSourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnExpression(
    "${gw-sync.enabled:true} && '${gw-sync.mode:external}'.equalsIgnoreCase('local')"
)
public class GwLocalEventPublisher {

    private final GwSourceService sources;
    private final ApplicationEventPublisher events;

    // 요청 트랜잭션과 분리해 커밋된 대기 행만 조회하며, Kafka 발행기와 같은 기준을 사용합니다.

    /**
     * 로컬 이벤트 전달입니다. 커밋된 대기 원본 조회 → Spring 이벤트 발행 → 대상 처리 성공 후 발행 버전 확인.
     * 실패 시 다음 주기 재시도
     */
    @Scheduled(fixedDelayString = "${gw-sync.publish-delay-ms:1000}")
    public void dispatchPending() {
        for (var event : sources.pending()) {
            try {
                events.publishEvent(event);
                sources.confirmPublished(event.id(), event.revision());
            } catch (RuntimeException failure) {
                log.warn(
                    "GW 로컬 이벤트 처리 실패 · 다음 주기에 재시도: {} revision={}",
                    event.id(),
                    event.revision()
                );
                return;
            }
        }
    }
}
