package com.inven.core.backend.api.serverCapacity.controller;

import com.inven.core.backend.api.serverCapacity.dto.ServerCapacityDTO;
import com.inven.core.backend.api.serverCapacity.dto.ServerConfigDTO;
import com.inven.core.backend.api.serverCapacity.service.ServerCapacityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/server-capacity")
@RequiredArgsConstructor
public class ServerCapacityController {

    private final ServerCapacityService serverCapacityService;

    @Value("${server-capacity.servers:}")
    private String serversConfig;

    @GetMapping("/servers")
    public ResponseEntity<List<Map<String, Object>>> getMonitoredServers() {
        List<Map<String, Object>> servers = new ArrayList<>();
        if (serversConfig != null && !serversConfig.isEmpty()) {
            for (String entry : serversConfig.split(";")) {
                String[] parts = entry.split(",");
                if (parts.length >= 4) {
                    Map<String, Object> server = new HashMap<>();
                    server.put("serverNo", parts[0].trim());
                    server.put("serverType", parts[1].trim());
                    server.put("host", parts[2].trim());
                    server.put("port", Integer.parseInt(parts[3].trim()));
                    server.put("user", parts.length > 4 ? parts[4].trim() : "ec2-user");
                    server.put("osType", parts.length > 5 ? parts[5].trim() : "LINUX");
                    servers.add(server);
                }
            }
        }
        return ResponseEntity.ok(servers);
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkServerCapacity(@RequestBody ServerConfigDTO serverConfig, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        try {
            ServerCapacityDTO result = serverCapacityService.checkAndSaveServerCapacity(serverConfig, principal.getName());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("용량 조사 제한: 사용자 [{}], 서버 [{}] - {}", principal.getName(), serverConfig.getServerNo(), e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(e.getMessage());
        } catch (Exception e) {
            log.error("서버 용량 확인 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("서버 용량 확인에 실패했습니다: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ServerCapacityDTO>> getLatestServerCapacities() {
        List<ServerCapacityDTO> capacities = serverCapacityService.getLatestServerCapacities();
        return ResponseEntity.ok(capacities);
    }
}
