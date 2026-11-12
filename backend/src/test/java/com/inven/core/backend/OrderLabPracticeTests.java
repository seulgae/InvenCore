package com.inven.core.backend;

import com.inven.core.backend.api.orderlab.practice.*;
import org.junit.jupiter.api.Test;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderLabPracticeTests {
    @Test void unfinishedLearnerCodeDoesNotBreakReferenceMode() {
        var practice=new OrderLabPractice(new UserKafkaCode());
        assertDoesNotThrow(()->practice.requireReady(Implementation.REFERENCE));
        assertEquals(42,practice.nextOffset(false,41));
        assertFalse(practice.shouldApply(false,4,4));
        // UserKafkaCode is intentionally unfinished. The status endpoint must report this, not crash.
        assertNotNull(practice.inspectCode());
    }
}
