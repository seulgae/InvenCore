package com.inven.core.backend.api.orderlab;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;

@RestController @RequestMapping("/api/order-lab") @RequiredArgsConstructor
public class OrderLabController {
    private final OrderLabStore store;
    private final OrderLabEngine engine;
    private final GwSyncProperties properties;
    private final OrderLabPractice practice;
    @GetMapping("/practice") public OrderLabPractice.Report practice() { return practice.inspectCode(); }
    @PostMapping("/runs") @ResponseStatus(HttpStatus.CREATED)
    public Run start(@Valid @RequestBody Start input) { enabled(); return store.start(input); }
    @GetMapping("/runs/{id}") public RunView inspect(@PathVariable String id) { return store.inspect(id); }
    @GetMapping("/state") public State state() { enabled(); return engine.state(); }
    @PostMapping("/groups/{group}/{action}")
    public java.util.Map<String,String> control(@PathVariable Group group,@PathVariable String action) {
        enabled(); engine.control(group,action); return java.util.Map.of("message","명령 요청 완료: "+group+" / "+action);
    }
    private void enabled() {
        if(!properties.isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"GW_SYNC_ENABLED=true 설정이 필요합니다.");
    }
    @PostMapping("/groups/{group}/replay/{runId}")
    public java.util.Map<String,String> replayRun(@PathVariable Group group,@PathVariable String runId) {
        enabled(); engine.replayFrom(group,store.replayOffsets(runId));
        return java.util.Map.of("message","현재 주문의 시작 위치로 되감기를 요청했습니다.");
    }
}
