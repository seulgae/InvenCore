package com.inven.core.backend.api.gwsync.repository;

import com.inven.core.backend.api.gwsync.entity.GwSource;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface GwSourceRepository extends JpaRepository<GwSource, String> {
    /**
     * 원본 행을 비관적 잠금으로 조회해 같은 ID의 갱신을 직렬화합니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from GwSource s where s.id = :id")
    Optional<GwSource> findLocked(@Param("id") String id);

    /**
     * 현재 revision보다 발행 확인 버전이 낮은 원본을 제한된 개수만 조회합니다.
     */
    @Query("select s from GwSource s where s.revision > s.publishedRevision order by s.updatedAt")
    List<GwSource> findPending(Pageable pageable);

    /**
     * 최근 변경한 원본을 수정 시각 역순으로 최대 20개 조회합니다.
     */
    List<GwSource> findTop20ByOrderByUpdatedAtDesc();
}
