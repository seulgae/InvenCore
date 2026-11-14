package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.serverCapacity.service.HostCapacityService;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

class HostCapacityTests {

    @TempDir
    Path directory;

    private HostCapacityService service() {
        return new HostCapacityService(
            JsonMapper.builder().build(),
            directory.resolve("capacity.json").toString()
        );
    }

    private String snapshot(Instant measured) {
        return """
        {"schemaVersion":1,"measuredAt":"%s","cpuUsage":60.5,"logicalCpuCount":4,
        "memoryTotalBytes":1000,"memoryUsedBytes":600,"memoryAvailableBytes":400,
        "diskTotalBytes":2000,"diskUsedBytes":1000,"diskAvailableBytes":900}
        """.formatted(measured);
    }

    @Test
    void readsHostValuesWithoutSubstitutingJvmMetrics() throws Exception {
        Files.writeString(directory.resolve("capacity.json"), snapshot(Instant.now()));
        var value = service().read();
        assertEquals(60.5, value.cpuUsage());
        assertEquals(4, value.logicalCpuCount());
        assertEquals(1000, value.memoryTotalBytes());
        assertEquals(900, value.diskAvailableBytes());
    }

    @Test
    void missingMalformedStaleFutureOrInvalidCountersReturn503() throws Exception {
        assertEquals(
            HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () -> service().read()).getStatusCode()
        );
        for (String content : new String[] {
            "not json",
            "null",
            "{}",
            "x".repeat(9000),
            snapshot(Instant.now().minusSeconds(60)),
            snapshot(Instant.now().plusSeconds(60)),
            snapshot(Instant.now()).replace("60.5", "101"),
            snapshot(Instant.now()).replace("\"memoryUsedBytes\":600", "\"memoryUsedBytes\":1100"),
            snapshot(Instant.now()).replace(
                "\"diskAvailableBytes\":900",
                "\"diskAvailableBytes\":1100"
            ),
        }) {
            Files.writeString(directory.resolve("capacity.json"), content);
            assertEquals(
                HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(ResponseStatusException.class, () -> service().read()).getStatusCode()
            );
        }
    }
}
