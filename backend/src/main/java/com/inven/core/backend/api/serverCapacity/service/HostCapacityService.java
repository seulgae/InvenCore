package com.inven.core.backend.api.serverCapacity.service;

import com.inven.core.backend.api.serverCapacity.dto.HostCapacityDTO;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Service
public class HostCapacityService {

    private final ObjectMapper json;
    private final Path snapshot;

    public HostCapacityService(
        ObjectMapper json,
        @Value("${server-capacity.host-file:/run/invencore-host/capacity.json}") String file
    ) {
        this.json = json;
        this.snapshot = Path.of(file);
    }

    /** 고정된 읽기 전용 파일만 읽고, 누락·오래된·잘못된 결과는 성공으로 위장하지 않습니다. */
    public HostCapacityDTO read() {
        final HostCapacityDTO value;
        try {
            if (Files.size(snapshot) > 8192) throw new IllegalArgumentException();
            value = json.readValue(Files.readString(snapshot), HostCapacityDTO.class);
        } catch (Exception error) {
            throw unavailable(
                "Ubuntu 수집 결과가 없습니다. 호스트 수집기와 읽기 전용 마운트를 확인해 주세요."
            );
        }
        if (!valid(value)) throw unavailable("호스트 수집 결과 형식이 올바르지 않습니다.");
        long age = Duration.between(value.measuredAt(), Instant.now()).getSeconds();
        if (age > 30 || age < -5) {
            throw unavailable(
                "호스트 수집이 중단되었거나 시간이 맞지 않습니다. 수집기 상태를 확인해 주세요."
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
