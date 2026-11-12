package com.inven.core.backend.api.orderlab;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @Slf4j
public class OrderLabPublisher {
    private final OrderLabEventRepository events;
    private final OrderLabStore store;
    private final OrderLabEngine engine;
    private final GwSyncProperties properties;
    @Scheduled(fixedDelayString="${order-lab.publish-delay-ms:500}")
    public void publishOrders() {
        if(!properties.isEnabled()) return;
        for(var event:events.findTop30ByBrokerOffsetIsNullOrderByIdAsc()) {
            try { store.confirm(event.getId(),engine.publish(event)); }
            catch(InterruptedException failure) { Thread.currentThread().interrupt(); return; }
            catch(Exception failure) { log.warn("주문 실습 발행 실패 · 다음 주기 재시도: {}",event.getEventId()); return; }
        }
    }
}
