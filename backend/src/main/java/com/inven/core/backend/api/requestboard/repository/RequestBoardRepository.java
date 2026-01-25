package com.inven.core.backend.api.requestboard.repository;

import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestBoardRepository extends JpaRepository<RequestBoard, Long> {
}
