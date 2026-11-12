package com.inven.core.backend.api.orderlab;

import static com.inven.core.backend.api.orderlab.OrderLabDto.*;

import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;
import java.nio.charset.StandardCharsets;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.common.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OrderLabStore {

    private final OrderLabEventRepository events;
    private final OrderLabProjectionRepository projections;
    private final OrderLabDeliveryRepository deliveries;
    private final OrderLabPractice practice;

    /**
     * 키별 파티션 선택입니다. Kafka 기본 키 해시와 같은 Murmur2로 고정 3개 파티션 중 하나를 선택. 실험
     * 재현을 위해 발행 시 파티션을 명시
     */
    public static int keyPartition(String key) {
        return Utils.toPositive(Utils.murmur2(key.getBytes(StandardCharsets.UTF_8))) % 3;
    }

    /**
     * 실습 코드 준비 여부를 확인하고 주문별 네 단계 이벤트를 목적 파티션과 함께 저장합니다.
     */
    @Transactional
    public Run start(Start request) {
        practice.requireReady(request.implementation());
        String runId = UUID.randomUUID().toString();
        String[] statuses = { "CREATED", "PAID", "PACKED", "SHIPPED" };
        for (int order = 0; order < request.orders(); order++) {
            String key;
            int suffix = 0;
            do {
                key = "ORD-" + runId.substring(0, 8) + "-" + order + "-" + suffix++;
            } while (keyPartition(key) != order % 3);
            for (int step = 0; step < 4; step++) {
                events.save(
                    OrderLabEvent.builder()
                        .runId(runId)
                        .orderId(key)
                        .sequence(step + 1)
                        .status(statuses[step])
                        .partition(
                            practice.partition(
                                request.implementation(),
                                key,
                                step + 1,
                                request.routing()
                            )
                        )
                        .learner(request.implementation() == Implementation.LEARNER)
                        .build()
                );
            }
        }
        return new Run(runId, request.routing(), request.orders() * 4, request.implementation());
    }

    /**
     * 발행한 이벤트를 조회해 브로커의 확인 위치를 저장합니다.
     */
    @Transactional
    public void confirm(long id, Position position) {
        events.findById(id).orElseThrow().confirm(position);
    }

    /**
     * 주문 상태 반영과 관측입니다. 주문의 첫 이벤트 행 잠금 → 그룹별 projection 조회 → 업무 버전·누락 비교
     * → 상태와 처리 기록 저장. Kafka 커밋은 별도 단계
     */
    @Transactional
    public void consume(Message message, Group group, int partition, long offset) {
        if (events.lockOrder(message.runId(), message.orderId()).isEmpty()) {
            return;
        }
        String id = group + ":" + message.orderId();
        var projection = projections
            .findById(id)
            .orElseGet(() ->
                OrderLabProjection.builder()
                    .runId(message.runId())
                    .orderId(message.orderId())
                    .group(group)
                    .build()
            );
        String outcome = projection.apply(
            message,
            practice.shouldApply(
                message.learner(),
                projection.getLastSequence(),
                message.sequence()
            )
        );
        projections.save(projection);
        deliveries.save(
            OrderLabDelivery.builder()
                .message(message)
                .group(group)
                .partition(partition)
                .offset(offset)
                .outcome(outcome)
                .build()
        );
    }

    /**
     * 미션 시작 위치 선택입니다. 실행의 발행 완료 이벤트에서 파티션별 최소 offset을 구함 → 해당 파티션 콜백에
     * seek 요청. 이전 실행 전체를 되감지 않습니다.
     */
    @Transactional(readOnly = true)
    public Map<Integer, Long> replayOffsets(String runId) {
        var records = events.findByRunIdOrderByIdAsc(runId);
        if (records.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "실습 실행을 찾을 수 없습니다."
            );
        }
        if (records.stream().anyMatch(record -> record.getBrokerOffset() == null)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "모든 카드가 발행된 뒤 되감아 주세요."
            );
        }
        Map<Integer, Long> offsets = new HashMap<>();
        records.forEach(record ->
            offsets.merge(record.getBrokerPartition(), record.getBrokerOffset(), Math::min)
        );
        return offsets;
    }

    /**
     * 실행의 발행 수, 최근 처리 내역과 그룹별 주문 상태를 함께 조회합니다.
     */
    @Transactional(readOnly = true)
    public RunView inspect(String runId) {
        var records = events.findByRunIdOrderByIdAsc(runId);
        if (records.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "실습 실행을 찾을 수 없습니다."
            );
        }
        return new RunView(
            runId,
            records
                .stream()
                .filter(e -> e.getBrokerOffset() != null)
                .count(),
            deliveries
                .findTop240ByRunIdOrderByIdDesc(runId)
                .stream()
                .map(OrderLabDelivery::view)
                .toList(),
            projections
                .findByRunIdOrderByOrderIdAsc(runId)
                .stream()
                .map(OrderLabProjection::view)
                .toList()
        );
    }
}
