package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.inven.core.backend.api.serverCapacity.service.HostCapacityClient;
import com.inven.core.backend.api.serverCapacity.service.HostCapacityService;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

class HostCapacityTests {

    private final HostCapacityClient client = mock(HostCapacityClient.class);

    private HostCapacityService service() {
        return new HostCapacityService(JsonMapper.builder().build(), client);
    }

    private String snapshot(Instant measured) {
        return """
        {"schemaVersion":1,"measuredAt":"%s","cpuUsage":60.5,"logicalCpuCount":4,
        "memoryTotalBytes":1000,"memoryUsedBytes":600,"memoryAvailableBytes":400,
        "diskTotalBytes":2000,"diskUsedBytes":1000,"diskAvailableBytes":900}
        """.formatted(measured);
    }

    @Test
    void requestsHostEveryTimeWithoutCachedFiles() throws Exception {
        when(client.request()).thenReturn(snapshot(Instant.now()));
        var value = service().read();
        assertEquals(60.5, value.cpuUsage());
        assertEquals(4, value.logicalCpuCount());
        assertEquals(1000, value.memoryTotalBytes());
        assertEquals(900, value.diskAvailableBytes());
        service().read();
        verify(client, times(2)).request();
    }

    @Test
    void unreachableMalformedStaleFutureOrInvalidCountersReturn503() throws Exception {
        when(client.request()).thenThrow(new IOException("unavailable"));
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () -> service().read()).getStatusCode()
        );
        for (String content : new String[] {
            "not json",
            "null",
            "{}",
            snapshot(Instant.now().minusSeconds(60)),
            snapshot(Instant.now().plusSeconds(60)),
            snapshot(Instant.now()).replace("60.5", "101"),
            snapshot(Instant.now()).replace("\"memoryUsedBytes\":600", "\"memoryUsedBytes\":1100"),
            snapshot(Instant.now()).replace(
                "\"diskAvailableBytes\":900",
                "\"diskAvailableBytes\":1100"
            ),
        }) {
            reset(client);
            when(client.request()).thenReturn(content);
            assertEquals(
                HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(ResponseStatusException.class, () -> service().read()).getStatusCode()
            );
        }
    }

    @Test
    void busyHostReturns429() throws Exception {
        when(client.request()).thenReturn("{\"error\":\"BUSY\"}");
        assertEquals(
            HttpStatus.TOO_MANY_REQUESTS,
            assertThrows(ResponseStatusException.class, () -> service().read()).getStatusCode()
        );
    }
}
