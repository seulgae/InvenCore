package com.inven.core.backend.api.gwsync.repository;

import com.inven.core.backend.api.gwsync.entity.GwSource;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface GwSourceRepository extends JpaRepository<GwSource, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from GwSource s where s.id = :id")
    Optional<GwSource> findLocked(@Param("id") String id);

    @Query("select s from GwSource s where s.revision > s.publishedRevision order by s.updatedAt")
    List<GwSource> findPending(Pageable pageable);

    List<GwSource> findTop20ByOrderByUpdatedAtDesc();
}
