package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.service.GwProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnExpression(
    "${gw-sync.enabled:true} && '${gw-sync.mode:local}'.equalsIgnoreCase('local')"
)
public class GwLocalEventListener {

    private final GwProjectionService projection;

    /**
     * 로컬 이벤트 수신입니다. 내부 변경 이벤트 → 외부 모드와 동일한 GwProjectionService로 대상 버전
     * 검증·JPA 반영
     */
    @EventListener
    public void onLocalChange(GwChangedEvent event) {
        projection.project(event);
    }
}
