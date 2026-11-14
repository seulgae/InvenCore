package com.inven.core.backend.api.serverCapacity.service.impl;

import com.inven.core.backend.api.serverCapacity.dto.ServerCapacityDTO;
import com.inven.core.backend.api.serverCapacity.dto.ServerConfigDTO;
import com.inven.core.backend.api.serverCapacity.entity.ServerCapacity;
import com.inven.core.backend.api.serverCapacity.entity.ServerCapacityCheckLog;
import com.inven.core.backend.api.serverCapacity.repository.ServerCapacityCheckLogRepository;
import com.inven.core.backend.api.serverCapacity.repository.ServerCapacityRepository;
import com.inven.core.backend.api.serverCapacity.service.ServerCapacityService;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.channel.ClientChannel;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.channel.Channel;
import org.apache.sshd.common.keyprovider.FileKeyPairProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnExpression("${feature.server-capacity.enabled:true} and '${server-capacity.mode:host}' == 'ssh'")
public class ServerCapacityServiceImpl implements ServerCapacityService {

    private final ServerCapacityRepository serverCapacityRepository;
    private final ServerCapacityCheckLogRepository checkLogRepository;
    private static final long SSH_TIMEOUT_SECONDS = 10;

    @org.springframework.beans.factory.annotation.Value("${server-capacity.pem-file}")
    private String pemFileName;

    /**
     * 조사 및 결과 저장입니다. 사용자·서버별 마지막 조사 날짜 확인 → SSH 수집 → 기존 결과 갱신 또는 신규 저장
     * → 조사 시각 저장
     */
    @Override
    @Transactional
    public ServerCapacityDTO checkAndSaveServerCapacity(
        ServerConfigDTO serverConfig,
        String username
    ) throws Exception {
        log.info("사용자 [{}]의 서버 용량 확인 시작: {}", username, serverConfig.getHost());

        Optional<ServerCapacityCheckLog> logOpt = checkLogRepository.findByUsernameAndServerNo(
            username,
            serverConfig.getServerNo()
        );
        if (
            logOpt.isPresent() &&
            logOpt.get().getLastCheckedAt().toLocalDate().isEqual(LocalDate.now())
        ) {
            throw new IllegalStateException("하루에 한 번만 용량을 조사할 수 있습니다.");
        }

        ServerCapacityDTO capacityDTO = getServerCapacityFromSsh(serverConfig);

        Optional<ServerCapacity> existingCapacityOpt =
            serverCapacityRepository.findFirstByServerNoOrderByRegDtDesc(
                serverConfig.getServerNo()
            );
        ServerCapacity serverCapacity;
        if (existingCapacityOpt.isPresent()) {
            serverCapacity = existingCapacityOpt.get();
            serverCapacity.update(
                capacityDTO.getServerType(),
                capacityDTO.getServerNo(),
                capacityDTO.getMemoryCapacity(),
                capacityDTO.getMemoryUsed(),
                capacityDTO.getMemoryAvailable(),
                capacityDTO.getMemoryShared(),
                capacityDTO.getMemoryBuffer(),
                capacityDTO.getMemoryFree(),
                capacityDTO.getCpuStatus(),
                capacityDTO.getCpuUsage(),
                capacityDTO.getSystemDiskTotal(),
                capacityDTO.getSystemDiskUsed(),
                capacityDTO.getSystemDiskUsagePercent()
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

        ServerCapacityCheckLog checkLog = logOpt.orElseGet(() ->
            ServerCapacityCheckLog.builder()
                .username(username)
                .serverNo(serverConfig.getServerNo())
                .build()
        );
        checkLog.setLastCheckedAt(LocalDateTime.now());
        checkLogRepository.save(checkLog);

        return toDTO(saved);
    }

    /**
     * 저장된 용량 조회입니다. Repository 전체 조회 → 엔티티를 DTO로 변환해 목록 반환
     */
    @Override
    @Transactional(readOnly = true)
    public List<ServerCapacityDTO> getLatestServerCapacities() {
        return serverCapacityRepository
            .findAll()
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * SSH 자원 수집입니다. 외부 키 파일 경로 확인 → 키 로드 → SSH 연결·인증 → df/free/top 실행 →
     * 출력 파싱 → 연결 종료
     */
    private ServerCapacityDTO getServerCapacityFromSsh(ServerConfigDTO serverConfig)
        throws Exception {
        if (pemFileName == null || pemFileName.isBlank()) {
            throw new IllegalArgumentException(
                "SSH_PEM_FILE에 외부 개인키 파일 경로를 지정해 주세요."
            );
        }
        Path pemPath = Path.of(pemFileName).toAbsolutePath().normalize();
        if (!Files.isRegularFile(pemPath) || !Files.isReadable(pemPath)) {
            throw new IllegalArgumentException("SSH 개인키 파일을 읽을 수 없습니다.");
        }
        FileKeyPairProvider keyPairProvider = new FileKeyPairProvider(pemPath);
        Iterable<KeyPair> keyPairs = keyPairProvider.loadKeys(null);
        KeyPair keyPair = keyPairs.iterator().next();
        SshClient client = SshClient.setUpDefaultClient();
        client.start();

        try (
            ClientSession session = client
                .connect(serverConfig.getUser(), serverConfig.getHost(), serverConfig.getPort())
                .verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .getSession()
        ) {
            // 현재 세션에 키 인증 수단을 등록합니다.
            session.addPublicKeyIdentity(keyPair);
            // 등록한 키로 제한 시간 내에 인증합니다.
            session.auth().verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("SSH 세션 연결 성공 (키 파일 인증): {}", serverConfig.getHost());
            String command = "df -h / | tail -n 1; free -m | grep Mem; top -bn1 | grep 'Cpu(s)'";

            ByteArrayOutputStream responseStream = new ByteArrayOutputStream();
            try (ClientChannel channel = session.createChannel(Channel.CHANNEL_EXEC, command)) {
                channel.setOut(responseStream);
                channel.setErr(new ByteArrayOutputStream());
                channel.open().verify(SSH_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                channel.waitFor(
                    EnumSet.of(ClientChannelEvent.CLOSED),
                    TimeUnit.SECONDS.toMillis(SSH_TIMEOUT_SECONDS)
                );
            }

            String output = responseStream.toString();
            log.debug("SSH 명령어 실행 결과:\n{}", output);
            return parseSshOutput(output, serverConfig);
        } finally {
            client.stop();
        }
    }

    /**
     * 명령 출력 파싱입니다. 출력을 줄별로 분리 → 디스크 열 추출 → 메모리 열 추출 → CPU us 값 추출 → DTO
     * 구성
     */
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

    /**
     * 응답 DTO 변환입니다. 엔티티의 응답에 필요한 필드를 DTO에 복사
     */
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
