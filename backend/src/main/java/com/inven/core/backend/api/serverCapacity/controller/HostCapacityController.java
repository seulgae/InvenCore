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

    /** 기존 인증 정책으로 보호되며 조회는 호스트 명령이나 파일 쓰기를 실행하지 않습니다. */
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
