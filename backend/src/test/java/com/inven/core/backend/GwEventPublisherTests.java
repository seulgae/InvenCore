package com.inven.core.backend;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.event.GwChangedEvent;
import com.inven.core.backend.api.gwsync.messaging.GwEventPublisher;
import com.inven.core.backend.api.gwsync.service.GwSourceService;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import tools.jackson.databind.json.JsonMapper;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GwEventPublisherTests {
    @Test void failedSendRemainsPendingAndIsConfirmedOnlyAfterSuccessfulRetry() {
        var sources = mock(GwSourceService.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        var properties = new GwSyncProperties();
        var event = GwChangedEvent.builder().schemaVersion(1).id("test-source").revision(2)
                .name("gw").description("v2").updatedAt(Instant.now()).build();
        when(sources.pending()).thenReturn(List.of(event));
        when(kafka.send(eq(properties.getTopic()), eq(event.id()), anyString()))
                .thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker offline")))
                .thenReturn(CompletableFuture.completedFuture(null));
        var publisher = new GwEventPublisher(sources, kafka, JsonMapper.builder().findAndAddModules().build(), properties);
        publisher.publishPending();
        verify(sources, never()).confirmPublished(anyString(), anyLong());
        publisher.publishPending();
        verify(sources).confirmPublished(event.id(), event.revision());
        verify(kafka, times(2)).send(eq(properties.getTopic()), eq(event.id()), anyString());
    }
}
