package com.inven.core.backend.api.serverCapacity.dto;

import java.time.Instant;

/** Ubuntu 전체 집계 수치입니다. 접속 정보와 프로세스 목록은 포함하지 않습니다. */
public record HostCapacityDTO(
    int schemaVersion,
    Instant measuredAt,
    double cpuUsage,
    int logicalCpuCount,
    long memoryTotalBytes,
    long memoryUsedBytes,
    long memoryAvailableBytes,
    long diskTotalBytes,
    long diskUsedBytes,
    long diskAvailableBytes
) {}
