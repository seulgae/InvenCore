package com.inven.core.backend.api.serverCapacity.service;

import com.inven.core.backend.api.serverCapacity.dto.ServerCapacityDTO;
import com.inven.core.backend.api.serverCapacity.dto.ServerConfigDTO;

import java.util.List;

public interface ServerCapacityService {

    /**
     * 서버 용량을 확인하고 데이터베이스에 저장합니다.
     * @param serverConfig 서버 설정 정보
     * @param username 요청한 사용자명
     * @return 저장된 서버 용량 정보
     * @throws Exception SSH 연결 또는 명령어 실행 오류
     */
    ServerCapacityDTO checkAndSaveServerCapacity(ServerConfigDTO serverConfig, String username) throws Exception;

    /**
     * 모든 서버의 최신 용량 정보를 조회합니다.
     * @return 서버 용량 정보 리스트
     */
    List<ServerCapacityDTO> getLatestServerCapacities();
}
