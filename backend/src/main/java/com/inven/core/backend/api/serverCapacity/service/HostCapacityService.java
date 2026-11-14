package com.inven.core.backend.api.serverCapacity.service;

import com.inven.core.backend.api.serverCapacity.dto.HostCapacityDTO;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Service
public class HostCapacityService {

    private final ObjectMapper json;
    private final HostCapacityClient client;

    public HostCapacityService(ObjectMapper json, HostCapacityClient client) {
        this.json = json;
        this.client = client;
    }

    /** 요청마다 호스트에 직접 측정을 요청합니다. 이전 결과를 읽거나 캐시하지 않습니다. */
    public HostCapacityDTO read() {
        Instant requestedAt = Instant.now();
        final HostCapacityDTO value;
        try {
            var response = json.readTree(client.request());
            if (response.has("error")) {
                if ("BUSY".equals(response.path("error").asText())) {
                    throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "서버가 다른 용량 조회를 처리 중입니다. 잠시 후 다시 조회해 주세요."
                    );
                }
                throw new IllegalArgumentException("Host measurement failed");
            }
            value = json.treeToValue(response, HostCapacityDTO.class);
        } catch (ResponseStatusException busy) {
            throw busy;
        } catch (Exception error) {
            throw unavailable(
                "Ubuntu 실시간 조회에 연결하지 못했습니다. 호스트 조회 서비스와 소켓 연결을 확인해 주세요."
            );
        }
        if (!valid(value)) throw unavailable("호스트 수집 결과 형식이 올바르지 않습니다.");
        if (
            value.measuredAt().isBefore(requestedAt.minusSeconds(2)) ||
            value.measuredAt().isAfter(Instant.now().plusSeconds(5))
        ) {
            throw unavailable(
                "현재 요청의 측정값이 아니거나 서버 시간이 맞지 않습니다. 호스트 조회 서비스를 확인해 주세요."
            );
        }
        return value;
    }

    private boolean valid(HostCapacityDTO value) {
        return (
            value != null &&
            value.schemaVersion() == 1 &&
            value.measuredAt() != null &&
            Double.isFinite(value.cpuUsage()) &&
            value.cpuUsage() >= 0 &&
            value.cpuUsage() <= 100 &&
            value.logicalCpuCount() > 0 &&
            value.memoryTotalBytes() > 0 &&
            value.memoryUsedBytes() >= 0 &&
            value.memoryUsedBytes() <= value.memoryTotalBytes() &&
            value.memoryAvailableBytes() == value.memoryTotalBytes() - value.memoryUsedBytes() &&
            value.diskTotalBytes() > 0 &&
            value.diskUsedBytes() >= 0 &&
            value.diskUsedBytes() <= value.diskTotalBytes() &&
            value.diskAvailableBytes() >= 0 &&
            value.diskAvailableBytes() <= value.diskTotalBytes() - value.diskUsedBytes()
        );
    }

    private ResponseStatusException unavailable(String message) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
