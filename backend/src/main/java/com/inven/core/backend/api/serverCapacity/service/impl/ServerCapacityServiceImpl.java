package com.inven.core.backend.api.serverCapacity.service.impl;

import com.inven.core.backend.api.serverCapacity.dto.ServerCapacityDTO;
import com.inven.core.backend.api.serverCapacity.dto.ServerConfigDTO;
import com.inven.core.backend.api.serverCapacity.entity.ServerCapacity;
import com.inven.core.backend.api.serverCapacity.entity.ServerCapacityCheckLog;
import com.inven.core.backend.api.serverCapacity.repository.ServerCapacityCheckLogRepository;
import com.inven.core.backend.api.serverCapacity.repository.ServerCapacityRepository;
import com.inven.core.backend.api.serverCapacity.service.ServerCapacityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.channel.ClientChannel;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.channel.Channel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServerCapacityServiceImpl implements ServerCapacityService {

    private final ServerCapacityRepository serverCapacityRepository;
    private final ServerCapacityCheckLogRepository checkLogRepository;
    private static final long SSH_TIMEOUT_SECONDS = 10;
    private static final String SERVER_PASSWORD = "Rlfxogud1@"; // 비밀번호 하드코딩

    @Override
    @Transactional
    public ServerCapacityDTO checkAndSaveServerCapacity(ServerConfigDTO serverConfig, String username) throws Exception {
        log.info("사용자 [{}]의 서버 용량 확인 시작: {}", username, serverConfig.getHost());

        Optional<ServerCapacityCheckLog> logOpt = checkLogRepository.findByUsernameAndServerNo(username, serverConfig.getServerNo());
        if (logOpt.isPresent() && logOpt.get().getLastCheckedAt().toLocalDate().isEqual(LocalDate.now())) {
            throw new IllegalStateException("하루에 한 번만 용량을 조사할 수 있습니다.");
        }

        ServerCapacityDTO capacityDTO = getServerCapacityFromSsh(serverConfig);

        Optional<ServerCapacity> existingCapacityOpt = serverCapacityRepository.findFirstByServerNoOrderByRegDtDesc(serverConfig.getServerNo());
        ServerCapacity serverCapacity;
        if (existingCapacityOpt.isPresent()) {
            serverCapacity = existingCapacityOpt.get();
            serverCapacity.update(
                capacityDTO.getServerType(), capacityDTO.getServerNo(),
                capacityDTO.getMemoryCapacity(), capacityDTO.getMemoryUsed(), capacityDTO.getMemoryAvailable(),
                capacityDTO.getMemoryShared(), capacityDTO.getMemoryBuffer(), capacityDTO.getMemoryFree(),
                capacityDTO.getCpuStatus(), capacityDTO.getCpuUsage(),
                capacityDTO.getSystemDiskTotal(), capacityDTO.getSystemDiskUsed(), capacityDTO.getSystemDiskUsagePercent()
            );
            log.info("서버 용량 정보 업데이트: {}", serverConfig.getServerNo());
        } else {
            serverCapacity = ServerCapacity.builder()
                .serverType(capacityDTO.getServerType())
                .serverNo(capacityDTO.getServerNo())
                .memoryCapacity(capacityDTO.getMemoryCapacity())
                .memoryUsed(capacityDTO.getMemoryUsed())
                .memoryAvailable(capacityDTO.getMemoryAvailable())
                .memoryShared(capacityDTO.getMemoryShared())
                .memoryBuffer(capacityDTO.getMemoryBuffer())
                .memoryFree(capacityDTO.getMemoryFree())
                .cpuStatus(capacityDTO.getCpuStatus())
                .cpuUsage(capacityDTO.getCpuUsage())
                .systemDiskTotal(capacityDTO.getSystemDiskTotal())
                .systemDiskUsed(capacityDTO.getSystemDiskUsed())
                .systemDiskUsagePercent(capacityDTO.getSystemDiskUsagePercent())
                .build();
            log.info("새 서버 용량 정보 생성: {}", serverConfig.getServerNo());
        }
        ServerCapacity saved = serverCapacityRepository.save(serverCapacity);

        ServerCapacityCheckLog checkLog = logOpt.orElseGet(() -> ServerCapacityCheckLog.builder()
                .username(username)
                .serverNo(serverConfig.getServerNo())
                .build());
        checkLog.setLastCheckedAt(LocalDateTime.now());
        checkLogRepository.save(checkLog);

        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServerCapacityDTO> getLatestServerCapacities() {
        return serverCapacityRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ServerCapacityDTO getServerCapacityFromSsh(ServerConfigDTO serverConfig) throws Exception {
        SshClient client = SshClient.setUpDefaultClient();
        client.start();

        try (ClientSession session = client.connect(serverConfig.getUser(), serverConfig.getHost(), serverConfig.getPort())
                                           .verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS).getSession()) {
            session.addPasswordIdentity(SERVER_PASSWORD); // 하드코딩된 비밀번호 사용
            session.auth().verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("SSH 세션 연결 성공: {}", serverConfig.getHost());
            String command = "df -h / | tail -n 1; free -m | grep Mem; top -bn1 | grep 'Cpu(s)'";
            
            ByteArrayOutputStream responseStream = new ByteArrayOutputStream();
            try (ClientChannel channel = session.createChannel(Channel.CHANNEL_EXEC, command)) {
                channel.setOut(responseStream);
                channel.setErr(new ByteArrayOutputStream());
                channel.open().verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                channel.waitFor(EnumSet.of(ClientChannelEvent.CLOSED), TimeUnit.SECONDS.toMillis(SSH_TIMEOUT_SECONDS));
            }

            String output = responseStream.toString();
            log.debug("SSH 명령어 실행 결과:\n{}", output);
            return parseSshOutput(output, serverConfig);

        } finally {
            client.stop();
        }
    }

    private ServerCapacityDTO parseSshOutput(String output, ServerConfigDTO serverConfig) {
        ServerCapacityDTO dto = new ServerCapacityDTO();
        dto.setServerType(serverConfig.getServerType());
        dto.setServerNo(serverConfig.getServerNo());

        String[] lines = output.split("\\r?\\n");

        if (lines.length > 0) {
            String[] diskParts = lines[0].trim().split("\\s+");
            if (diskParts.length >= 5) {
                dto.setSystemDiskTotal(diskParts[1]);
                dto.setSystemDiskUsed(diskParts[2]);
                dto.setSystemDiskUsagePercent(diskParts[4]);
            }
        }

        if (lines.length > 1) {
            String[] memParts = lines[1].trim().split("\\s+");
            if (memParts.length >= 7) {
                dto.setMemoryCapacity(memParts[1] + "M");
                dto.setMemoryUsed(memParts[2] + "M");
                dto.setMemoryFree(memParts[3] + "M");
                dto.setMemoryShared(memParts[4] + "M");
                dto.setMemoryBuffer(memParts[5] + "M");
                dto.setMemoryAvailable(memParts[6] + "M");
            }
        }

        if (lines.length > 2) {
            String cpuLine = lines[2];
            dto.setCpuStatus(cpuLine);
            String[] cpuParts = cpuLine.split(":")[1].trim().split(",");
            for (String part : cpuParts) {
                if (part.contains("us")) {
                    dto.setCpuUsage(part.trim().split("\\s+")[0] + "%");
                    break;
                }
            }
        }

        return dto;
    }

    private ServerCapacityDTO toDTO(ServerCapacity entity) {
        ServerCapacityDTO dto = new ServerCapacityDTO();
        dto.setSysSn(entity.getSysSn());
        dto.setServerType(entity.getServerType());
        dto.setServerNo(entity.getServerNo());
        dto.setMemoryCapacity(entity.getMemoryCapacity());
        dto.setMemoryUsed(entity.getMemoryUsed());
        dto.setMemoryAvailable(entity.getMemoryAvailable());
        dto.setMemoryShared(entity.getMemoryShared());
        dto.setMemoryBuffer(entity.getMemoryBuffer());
        dto.setMemoryFree(entity.getMemoryFree());
        dto.setCpuStatus(entity.getCpuStatus());
        dto.setCpuUsage(entity.getCpuUsage());
        dto.setSystemDiskTotal(entity.getSystemDiskTotal());
        dto.setSystemDiskUsed(entity.getSystemDiskUsed());
        dto.setSystemDiskUsagePercent(entity.getSystemDiskUsagePercent());
        if (entity.getRegDt() != null) {
            dto.setRegDt(entity.getRegDt().toString());
        }
        return dto;
    }
}
