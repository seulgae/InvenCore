package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.orderlab.*;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import org.junit.jupiter.api.Test;

class OrderLabPersistentLocalEngineTests {
    @Test
    void restartedLocalPublisherContinuesAfterPersistedOffsets() {
        var events = mock(OrderLabEventRepository.class);
        when(events.nextLocalOffset(0)).thenReturn(17L);
        when(events.nextLocalOffset(1)).thenReturn(0L);
        when(events.nextLocalOffset(2)).thenReturn(8L);
        var engine = new OrderLabLocalEngine(events, mock(OrderLabStore.class),
            new GwSyncProperties(), mock(OrderLabPractice.class));
        engine.restoreLogEnds();
        var event = mock(OrderLabEvent.class);
        when(event.getDestinationPartition()).thenReturn(0);
        assertEquals(17L, engine.publish(event).offset());
        assertEquals(18L, engine.publish(event).offset());
        when(event.getDestinationPartition()).thenReturn(1);
        assertEquals(0L, engine.publish(event).offset());
        when(event.getDestinationPartition()).thenReturn(2);
        assertEquals(8L, engine.publish(event).offset());
    }
}
