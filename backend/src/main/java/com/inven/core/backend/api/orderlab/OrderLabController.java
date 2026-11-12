package com.inven.core.backend.api.orderlab;

import static com.inven.core.backend.api.orderlab.OrderLabDto.*;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/order-lab")
@RequiredArgsConstructor
public class OrderLabController {

    private final OrderLabStore store;
    private final OrderLabEngine engine;
    private final GwSyncProperties properties;
    private final OrderLabPractice practice;

    /**
     * Kafka Java TODO 코드의 기본 계약 검사 결과를 반환합니다.
     */
    @GetMapping("/practice")
    public OrderLabPractice.Report practice() {
        return practice.inspectCode();
    }

    /**
     * 연동 활성 여부를 확인하고 새 주문 실습 실행을 생성합니다.
     */
    @PostMapping("/runs")
    @ResponseStatus(HttpStatus.CREATED)
    public Run start(@Valid @RequestBody Start input) {
        enabled();
        return store.start(input);
    }

    /**
     * 실행별 발행 수, 처리 기록과 현재 주문 상태를 조회합니다.
     */
    @GetMapping("/runs/{id}")
    public RunView inspect(@PathVariable String id) {
        return store.inspect(id);
    }

    /**
     * 현재 엔진의 소비 그룹별 파티션 위치와 지연 상태를 반환합니다.
     */
    @GetMapping("/state")
    public State state() {
        enabled();
        return engine.state();
    }

    /**
     * 소비 그룹 제어입니다. 실습 전용 그룹만 일시정지·재개·같은 그룹으로 재시작·처음부터 재처리. 재처리는 실제 일시정지
     * 확인 후 허용
     */
    @PostMapping("/groups/{group}/{action}")
    public java.util.Map<String, String> control(
        @PathVariable Group group,
        @PathVariable String action
    ) {
        enabled();
        engine.control(group, action);
        return java.util.Map.of("message", "명령 요청 완료: " + group + " / " + action);
    }

    /**
     * 연동 기능이 꺼져 있으면 주문 실습 요청을 거부합니다.
     */
    private void enabled() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "GW_SYNC_ENABLED=true 설정이 필요합니다."
            );
        }
    }

    /**
     * 선택한 실행의 파티션별 시작 위치를 구해 일시정지한 그룹에 되감기를 요청합니다.
     */
    @PostMapping("/groups/{group}/replay/{runId}")
    public java.util.Map<String, String> replayRun(
        @PathVariable Group group,
        @PathVariable String runId
    ) {
        enabled();
        engine.replayFrom(group, store.replayOffsets(runId));
        return java.util.Map.of("message", "현재 주문의 시작 위치로 되감기를 요청했습니다.");
    }
}
