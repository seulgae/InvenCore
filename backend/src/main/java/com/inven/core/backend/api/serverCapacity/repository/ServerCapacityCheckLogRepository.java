package com.inven.core.backend.api.serverCapacity.repository;

import com.inven.core.backend.api.serverCapacity.entity.ServerCapacityCheckLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServerCapacityCheckLogRepository extends JpaRepository<ServerCapacityCheckLog, Long> {

    /**
     * 사용자와 서버 번호로 최신 확인 로그를 조회합니다.
     * @param username 사용자명
     * @param serverNo 서버 번호
     * @return 확인 로그 정보
     */
    Optional<ServerCapacityCheckLog> findByUsernameAndServerNo(String username, String serverNo);
}
