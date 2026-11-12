package com.inven.core.backend.api.orderlab;

import static com.inven.core.backend.api.orderlab.OrderLabDto.*;

public interface OrderLabEngine {
    /**
     * 주문 이벤트를 전달하고 배정된 파티션과 오프셋을 반환합니다.
     */
    Position publish(OrderLabEvent event) throws Exception;

    /**
     * 소비 그룹의 일시정지 여부와 파티션별 처리 위치를 반환합니다.
     */
    State state();

    /**
     * 소비 그룹 제어입니다. 실습 전용 그룹만 일시정지·재개·같은 그룹으로 재시작·처음부터 재처리. 재처리는 실제 일시정지
     * 확인 후 허용
     */
    void control(Group group, String action);

    /**
     * 현재 주문 위치로 되감기입니다. 소비 그룹의 실제 일시정지 확인 → 해당 주문이 있는 파티션만 시작 offset으로
     * 이동 → 재개 시 그 위치부터 읽음
     */
    void replayFrom(Group group, java.util.Map<Integer, Long> offsets);
}
