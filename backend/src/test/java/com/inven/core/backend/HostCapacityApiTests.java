package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.inven.core.backend.api.serverCapacity.dto.HostCapacityDTO;
import com.inven.core.backend.api.serverCapacity.service.HostCapacityService;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(
    properties = {
        "gw-sync.enabled=false",
        "benchmark.rows=1000",
        "feature.server-capacity.enabled=true",
        "server-capacity.mode=host",
        "spring.datasource.url=jdbc:h2:mem:host-capacity-test",
    }
)
@AutoConfigureMockMvc
class HostCapacityApiTests {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    HostCapacityService service;

    @Test
    void anonymousCannotReadHostMetrics() throws Exception {
        mvc.perform(get("/api/server-capacity/host")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void authenticatedReadReturnsMetricsAndDisablesCaching() throws Exception {
        when(service.read()).thenReturn(
            new HostCapacityDTO(1, Instant.now(), 12, 4, 1000, 600, 400, 2000, 1000, 900)
        );
        mvc.perform(get("/api/server-capacity/host").with(user("monitor")))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.logicalCpuCount").value(4))
            .andExpect(jsonPath("$.memoryUsedBytes").value(600));
    }

    @Test
    void missingCollectorReturnsActionable503() throws Exception {
        when(service.read()).thenThrow(
            new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "수집기 확인 필요")
        );
        mvc.perform(get("/api/server-capacity/host").with(user("monitor")))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("수집기 확인 필요"));
    }
}
