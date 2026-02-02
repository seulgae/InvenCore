package com.inven.core.backend.api.serverCapacity.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "server_capacity_check_log",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"username", "server_no"})
       })
public class ServerCapacityCheckLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "server_no", nullable = false, length = 50)
    private String serverNo;

    @Column(name = "last_checked_at", nullable = false)
    private LocalDateTime lastCheckedAt;

    @Builder
    public ServerCapacityCheckLog(String username, String serverNo, LocalDateTime lastCheckedAt) {
        this.username = username;
        this.serverNo = serverNo;
        this.lastCheckedAt = lastCheckedAt;
    }
}
