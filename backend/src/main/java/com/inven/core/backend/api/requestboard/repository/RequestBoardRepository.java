package com.inven.core.backend.api.requestboard.repository;

import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestBoardRepository extends JpaRepository<RequestBoard, Long> {

    List<RequestBoard> findAllByOrderByCreatedAtDesc();

    Page<RequestBoard> findAll(Pageable pageable);

    List<RequestBoard> findByAuthorOrderByCreatedAtDesc(String author);

    boolean existsByIdAndAuthor(Long id, String author);
}