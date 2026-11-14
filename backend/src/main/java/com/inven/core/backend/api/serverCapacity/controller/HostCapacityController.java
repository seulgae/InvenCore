package com.inven.core.backend.api.serverCapacity.controller;

import com.inven.core.backend.api.serverCapacity.dto.HostCapacityDTO;
import com.inven.core.backend.api.serverCapacity.service.HostCapacityService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@ConditionalOnExpression(
    "${feature.server-capacity.enabled:true} and '${server-capacity.mode:host}' == 'host'"
)
public class HostCapacityController {

    private final HostCapacityService service;

    /** 기존 인증 정책을 유지하며 요청마다 Ubuntu 호스트 조회 서비스에 실제 측정을 요청합니다. */
    @GetMapping("/api/server-capacity/host")
    public ResponseEntity<?> getHostCapacity() {
        try {
            HostCapacityDTO result = service.read();
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(result);
        } catch (ResponseStatusException error) {
            return ResponseEntity.status(error.getStatusCode())
                .cacheControl(CacheControl.noStore())
                .body(Map.of("message", error.getReason()));
        }
    }
}
