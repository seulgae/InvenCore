package com.inven.core.backend.api.gwsync.controller;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.service.*;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gw-sync")
@RequiredArgsConstructor
public class GwSyncController {

    private final GwSourceService sources;
    private final GwQueryService queries;
    private final GwSyncProperties properties;

    /**
     * GW 연동의 활성 여부, 실행 모드와 캐시 설정을 반환합니다.
     */
    @GetMapping("/status")
    public Status configuration() {
        boolean local = properties.getMode() == GwSyncProperties.Mode.LOCAL;
        return new Status(
            properties.isEnabled(),
            properties.getMode().name(),
            local ? "SPRING_EVENTS" : "KAFKA",
            local ? "MEMORY" : "REDIS",
            local ? null : properties.getTopic(),
            local ? null : properties.getTopic() + ".DLT",
            properties.getCacheTtlSeconds()
        );
    }

    /**
     * 최근 변경한 GW 원본 목록을 조회합니다.
     */
    @GetMapping("/items")
    public List<Source> recent() {
        return sources.recent();
    }

    /**
     * 선택한 원본의 DB 연동 상태와 캐시 형상을 조회합니다.
     */
    @GetMapping("/items/{id}")
    public State inspect(@PathVariable String id) {
        return queries.inspect(id);
    }

    /**
     * 입력값 검증을 통과한 요청을 원본 생성 서비스에 전달합니다.
     */
    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public Source create(@Valid @RequestBody Input input) {
        return sources.create(input);
    }

    /**
     * 원본 ID와 입력값을 서비스에 전달해 새 변경 버전을 저장합니다.
     */
    @PutMapping("/items/{id}")
    public Source update(@PathVariable String id, @Valid @RequestBody Input input) {
        return sources.update(id, input);
    }

    /**
     * 원본을 삭제 상태로 변경하도록 요청합니다.
     */
    @DeleteMapping("/items/{id}")
    public Source delete(@PathVariable String id) {
        return sources.delete(id);
    }
}
