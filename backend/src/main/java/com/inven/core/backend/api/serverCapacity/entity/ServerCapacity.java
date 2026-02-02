package com.inven.core.backend.api.serverCapacity.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "server_capacity")
public class ServerCapacity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sys_sn")
    private Long sysSn;

    @Column(name = "server_type", length = 50)
    private String serverType;

    @Column(name = "server_no", length = 50)
    private String serverNo;

    @Column(name = "memory_capacity", length = 50)
    private String memoryCapacity;

    @Column(name = "memory_used", length = 50)
    private String memoryUsed;

    @Column(name = "memory_available", length = 50)
    private String memoryAvailable;

    @Column(name = "memory_shared", length = 50)
    private String memoryShared;

    @Column(name = "memory_buffer", length = 50)
    private String memoryBuffer;

    @Column(name = "memory_free", length = 50)
    private String memoryFree;

    @Column(name = "cpu_status", length = 255)
    private String cpuStatus;

    @Column(name = "cpu_usage", length = 50)
    private String cpuUsage;

    @Column(name = "system_disk_total", length = 50)
    private String systemDiskTotal;

    @Column(name = "system_disk_used", length = 50)
    private String systemDiskUsed;

    @Column(name = "system_disk_usage_percent", length = 50)
    private String systemDiskUsagePercent;

    @CreationTimestamp
    @Column(name = "reg_dt", nullable = false, updatable = false)
    private LocalDateTime regDt;

    @Builder
    public ServerCapacity(String serverType, String serverNo, String memoryCapacity, String memoryUsed, String memoryAvailable, String memoryShared, String memoryBuffer, String memoryFree, String cpuStatus, String cpuUsage, String systemDiskTotal, String systemDiskUsed, String systemDiskUsagePercent) {
        this.serverType = serverType;
        this.serverNo = serverNo;
        this.memoryCapacity = memoryCapacity;
        this.memoryUsed = memoryUsed;
        this.memoryAvailable = memoryAvailable;
        this.memoryShared = memoryShared;
        this.memoryBuffer = memoryBuffer;
        this.memoryFree = memoryFree;
        this.cpuStatus = cpuStatus;
        this.cpuUsage = cpuUsage;
        this.systemDiskTotal = systemDiskTotal;
        this.systemDiskUsed = systemDiskUsed;
        this.systemDiskUsagePercent = systemDiskUsagePercent;
    }
    
    public void update(String serverType, String serverNo, String memoryCapacity, String memoryUsed, String memoryAvailable, String memoryShared, String memoryBuffer, String memoryFree, String cpuStatus, String cpuUsage, String systemDiskTotal, String systemDiskUsed, String systemDiskUsagePercent) {
        this.serverType = serverType;
        this.serverNo = serverNo;
        this.memoryCapacity = memoryCapacity;
        this.memoryUsed = memoryUsed;
        this.memoryAvailable = memoryAvailable;
        this.memoryShared = memoryShared;
        this.memoryBuffer = memoryBuffer;
        this.memoryFree = memoryFree;
        this.cpuStatus = cpuStatus;
        this.cpuUsage = cpuUsage;
        this.systemDiskTotal = systemDiskTotal;
        this.systemDiskUsed = systemDiskUsed;
        this.systemDiskUsagePercent = systemDiskUsagePercent;
    }
}
