package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.orderlab.OrderLabDto.Routing;
import com.inven.core.backend.api.orderlab.practice.UserKafkaCode;
import java.util.HashSet;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/** Opt in: gradlew test --tests "*OrderLabPracticeContractTests" -PorderLabPractice */
@EnabledIfSystemProperty(named = "orderlab.practice", matches = "true")
class OrderLabPracticeContractTests {

    private final UserKafkaCode code = new UserKafkaCode();

    @Test
    void sameOrderKeepsItsPartitionAndDifferentOrdersDistribute() {
        var distribution = new HashSet<Integer>();
        for (String key : new String[] { "ORDER-A", "ORDER-B", "ORDER-C", "ORDER-D" }) {
            int partition = code.selectPartition(key, 1, 3, Routing.KEYED);
            assertTrue(partition >= 0 && partition < 3);
            distribution.add(partition);
            for (int step = 2; step <= 4; step++) assertEquals(
                partition,
                code.selectPartition(key, step, 3, Routing.KEYED)
            );
        }
        assertTrue(distribution.size() > 1, "다른 주문도 모두 한 파티션에 몰리지 않게 하세요.");
    }

    @Test
    void spreadUsesDifferentPartitionsForConsecutiveSteps() {
        for (int step = 1; step <= 8; step++) assertEquals(
            (step - 1) % 3,
            code.selectPartition("ORDER-A", step, 3, Routing.SPREAD)
        );
    }

    @Test
    void committedOffsetPointsToNextRecord() {
        for (long offset : new long[] { 0, 1, 41, 1_000_000_000L, 3_000_000_000L })
            assertEquals(offset + 1, code.nextOffset(offset));
    }

    @Test
    void newBusinessVersionAppliesButDuplicateAndStaleDoNot() {
        assertTrue(code.shouldApply(0, 1));
        assertTrue(code.shouldApply(4, 5));
        assertFalse(code.shouldApply(4, 4));
        assertFalse(code.shouldApply(4, 1));
    }
}
