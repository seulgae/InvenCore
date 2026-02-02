package com.inven.core.backend.api.serverCapacity.repository;

import com.inven.core.backend.api.serverCapacity.entity.ServerCapacity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServerCapacityRepository extends JpaRepository<ServerCapacity, Long> {

    /**
     * 서버 번호로 최신 서버 용량 정보를 조회합니다.
     * @param serverNo 서버 번호
     * @return 서버 용량 정보
     */
    Optional<ServerCapacity> findFirstByServerNoOrderByRegDtDesc(String serverNo);
}
