package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.practice.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/** Intentionally opt-in: each TODO is the user's assignment, not a broken default build. */
@EnabledIfSystemProperty(named = "inventory.practice", matches = "true")
class InventoryPracticeContractTests {

    private final InventoryPractice practice = new InventoryPractice(
        new UserParallelCode(),
        new UserIndexCode(),
        new UserGwCode(),
        new UserCapacityCode(),
        new UserAuthCode(),
        new UserBoardCode(),
        new UserFilesCode(),
        new UserCommentsCode()
    );

    private void verify(String id) {
        var report = practice.inspect(id);
        assertTrue(report.ready(), () -> report.checks().toString());
    }

    @Test
    void parallelStream() {
        verify("parallel-stream");
    }

    @Test
    void indexTuning() {
        verify("index-tuning");
    }

    @Test
    void gwSync() {
        verify("gw-sync");
    }

    @Test
    void capacity() {
        verify("capacity");
    }

    @Test
    void auth() {
        verify("auth");
    }

    @Test
    void board() {
        verify("board");
    }

    @Test
    void files() {
        verify("files");
    }

    @Test
    void comments() {
        verify("comments");
    }
}
