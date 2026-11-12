package com.inven.core.backend.api.gwsync.messaging;

import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.service.GwProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor
@ConditionalOnExpression("${gw-sync.enabled:true} && '${gw-sync.mode:local}'.equalsIgnoreCase('local')")
public class GwLocalEventListener {
    private final GwProjectionService projection;

    @EventListener
    public void onLocalChange(GwChangedEvent event) { projection.project(event); }
}
