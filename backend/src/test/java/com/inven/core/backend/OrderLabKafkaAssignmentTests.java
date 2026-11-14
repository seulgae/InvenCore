package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.inven.core.backend.api.orderlab.*;
import java.util.Map;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.ConsumerSeekAware.ConsumerSeekCallback;
import org.springframework.kafka.listener.MessageListenerContainer;
import org.springframework.web.server.ResponseStatusException;

class OrderLabKafkaAssignmentTests {

    private final String topic = "orders";

    @Test
    void replayWithoutSeekCallbacksMustNotSilentlySucceed() {
        var listener = new OrderLabKafkaConsumer(OrderLabDto.Group.PROCESSING, null, null, null);
        assertFalse(listener.hasAssignments(topic, 3));
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, listener::replayBeginning).getStatusCode()
        );
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () ->
                listener.replayOffsets(Map.of(0, 10L))
            ).getStatusCode()
        );
    }

    @Test
    void everyPartitionMustBeAssignedAndCallbacksMustBeClearedOnRevoke() {
        var listener = new OrderLabKafkaConsumer(OrderLabDto.Group.PROCESSING, null, null, null);
        var callback = mock(ConsumerSeekCallback.class);
        listener.registerSeekCallback(callback);
        listener.onPartitionsAssigned(Map.of(new TopicPartition(topic, 0), 0L), callback);
        assertFalse(listener.hasAssignments(topic, 3));
        listener.onPartitionsAssigned(
            Map.of(new TopicPartition(topic, 1), 0L, new TopicPartition(topic, 2), 0L),
            callback
        );
        assertTrue(listener.hasAssignments(topic, 3));
        listener.replayOffsets(Map.of(1, 12L));
        verify(callback).seek(topic, 1, 12L);
        listener.onPartitionsRevoked(java.util.List.of(new TopicPartition(topic, 1)));
        assertFalse(listener.hasAssignments(topic, 3));
    }

    @Test
    void pausedContainerWithoutAssignmentsCannotAcceptReplay() {
        var listener = mock(OrderLabKafkaConsumer.class);
        when(listener.getListenerId()).thenReturn("processing");
        var registry = mock(KafkaListenerEndpointRegistry.class);
        var container = mock(MessageListenerContainer.class);
        when(registry.getListenerContainer("processing")).thenReturn(container);
        when(container.isContainerPaused()).thenReturn(true);
        var engine = new OrderLabKafkaEngine(
            null,
            null,
            registry,
            null,
            topic,
            listener,
            mock(OrderLabKafkaConsumer.class)
        );
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () ->
                engine.control(OrderLabDto.Group.PROCESSING, "replay")
            ).getStatusCode()
        );
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () ->
                engine.replayFrom(OrderLabDto.Group.PROCESSING, Map.of(0, 10L))
            ).getStatusCode()
        );
        verify(listener, never()).replayBeginning();
        verify(listener, never()).replayOffsets(anyMap());
        when(listener.hasAssignments(topic, 3)).thenReturn(true);
        engine.control(OrderLabDto.Group.PROCESSING, "replay");
        verify(listener).replayBeginning();
    }
}
