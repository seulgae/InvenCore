package com.inven.core.backend.api.orderlab;

import static com.inven.core.backend.api.orderlab.OrderLabDto.*;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(
    prefix = "gw-sync",
    name = "mode",
    havingValue = "local",
    matchIfMissing = true
)
public class OrderLabLocalEngine implements OrderLabEngine {

    private final OrderLabEventRepository events;
    private final OrderLabStore store;
    private final GwSyncProperties properties;
    private final OrderLabPractice practice;
    private final long[] ends = new long[3];
    private final long[][] positions = new long[2][3];
    private final long[][] committed = new long[2][3];
    private final boolean[] paused = new boolean[2];

    /**
     * 지정한 파티션의 로컬 로그 끝 위치를 증가시키고 배정된 위치를 반환합니다.
     */
    @Override
    public synchronized Position publish(OrderLabEvent event) {
        int partition = event.getDestinationPartition();
        return new Position(partition, ends[partition]++);
    }

    /**
     * 로컬 소비 모형입니다. 일시정지하지 않은 그룹별로 DB 로그를 파티션 2→1→0 순서로 읽음 → 대상 반영 → 메모리
     * 체크포인트 갱신. 실제 Kafka 측정은 아닙니다.
     */
    @Scheduled(fixedDelayString = "${order-lab.consume-delay-ms:300}")
    public synchronized void consumeLocalOrders() {
        if (!properties.isEnabled()) {
            return;
        }
        for (Group group : Group.values()) {
            int g = group.ordinal();
            if (paused[g]) {
                continue;
            }
            // 파티션 간 순서 차이를 관찰하도록 2→1→0 순서로 읽는 로컬 학습 모형입니다.
            for (int p = 2; p >= 0; p--) {
                for (var event : events.records(p, positions[g][p], PageRequest.of(0, 4))) {
                    store.consume(event.message(), group, p, event.getBrokerOffset());
                    positions[g][p] = practice.nextOffset(
                        event.isLearner(),
                        event.getBrokerOffset()
                    );
                    committed[g][p] = positions[g][p];
                }
            }
        }
    }

    /**
     * 메모리의 로그 끝·커밋 위치로 그룹별 지연을 계산합니다. 실제 Kafka 측정값은 아닙니다.
     */
    @Override
    public synchronized State state() {
        List<GroupState> groups = new ArrayList<>();
        for (Group group : Group.values()) {
            List<PartitionState> partitions = new ArrayList<>();
            for (int p = 0; p < 3; p++) {
                partitions.add(
                    new PartitionState(
                        p,
                        0,
                        ends[p],
                        committed[group.ordinal()][p],
                        Math.max(0, ends[p] - committed[group.ordinal()][p])
                    )
                );
            }
            groups.add(
                new GroupState(group, paused[group.ordinal()], paused[group.ordinal()], partitions)
            );
        }
        return new State("LOCAL_SIMULATION", "local:order-events", groups);
    }

    /**
     * 소비 그룹 제어입니다. 실습 전용 그룹만 일시정지·재개·같은 그룹으로 재시작·처음부터 재처리. 재처리는 실제 일시정지
     * 확인 후 허용
     */
    @Override
    public synchronized void control(Group group, String action) {
        int g = group.ordinal();
        switch (action) {
            case "pause" -> paused[g] = true;
            case "resume" -> paused[g] = false;
            case "restart" -> {
                positions[g] = committed[g].clone();
                paused[g] = false;
            }
            case "replay" -> {
                if (!paused[g]) {
                    throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "그룹을 일시정지한 뒤 재처리하세요."
                    );
                }
                positions[g] = new long[3];
            }
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "지원하지 않는 그룹 명령입니다."
            );
        }
    }

    /**
     * 현재 주문 위치로 되감기입니다. 소비 그룹의 실제 일시정지 확인 → 해당 주문이 있는 파티션만 시작 offset으로
     * 이동 → 재개 시 그 위치부터 읽음
     */
    @Override
    public synchronized void replayFrom(Group group, Map<Integer, Long> offsets) {
        if (!paused[group.ordinal()]) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "작업자가 쉬는 상태에서 되감아 주세요."
            );
        }
        offsets.forEach((partition, offset) -> positions[group.ordinal()][partition] = offset);
    }
}
