package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.inven.core.backend.api.practice.*;
import java.util.*;
import java.util.function.LongUnaryOperator;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class InventoryPracticeTests {

    private static final List<String> IDS = List.of(
        "parallel-stream",
        "index-tuning",
        "gw-sync",
        "capacity",
        "auth",
        "board",
        "files",
        "comments"
    );

    private InventoryPractice create(
        UserParallelCode p,
        UserIndexCode i,
        UserGwCode g,
        UserCapacityCode c,
        UserAuthCode a,
        UserBoardCode b,
        UserFilesCode f,
        UserCommentsCode t
    ) {
        return new InventoryPractice(PostgreSqlIntegrationTest.dataSource(), p, i, g, c, a, b, f, t);
    }

    @Test
    void unfinishedCodeIsReportedWithoutBreakingWorkingExamples() {
        var practice = create(
            new UserParallelCode(),
            new UserIndexCode(),
            new UserGwCode(),
            new UserCapacityCode(),
            new UserAuthCode(),
            new UserBoardCode(),
            new UserFilesCode(),
            new UserCommentsCode()
        );
        for (String id : IDS) {
            var report = assertDoesNotThrow(() -> practice.inspect(id));
            assertEquals(id, report.cardId());
            assertFalse(report.checks().isEmpty());
            // Do not assert ready=false: these tests must still pass after the user completes the TODOs.
        }
        assertThrows(ResponseStatusException.class, () -> practice.inspect("not-a-card"));
    }

    @Test
    void contractsAcceptIndependentWorkingImplementationsIncludingActualPostgreSqlPlan() {
        // Test-only solutions validate the checker. They do not fill or bypass the learner files.
        var p = mock(UserParallelCode.class);
        when(p.aggregate(anyList(), anyBoolean(), any())).thenAnswer(call -> {
            List<Long> values = call.getArgument(0);
            boolean parallel = call.getArgument(1);
            LongUnaryOperator work = call.getArgument(2);
            return (parallel ? values.parallelStream() : values.stream())
                .mapToLong(work::applyAsLong)
                .sum();
        });
        var i = mock(UserIndexCode.class);
        when(i.sumSql()).thenReturn(
            "SELECT COALESCE(SUM(amount),0) AS total FROM practice_orders WHERE customer_id = ?"
        );
        when(i.indexSql()).thenReturn(
            "CREATE INDEX idx_practice_customer ON practice_orders(customer_id)"
        );
        var g = mock(UserGwCode.class);
        when(g.shouldApply(anyLong(), anyLong())).thenAnswer(
            c -> (long) c.getArgument(1) > (long) c.getArgument(0)
        );
        var c = mock(UserCapacityCode.class);
        when(c.parseDisk(any())).thenAnswer(call -> {
            String line = call.getArgument(0);
            if (line == null || line.isBlank()) throw new IllegalArgumentException();
            String[] cols = line.trim().split("\\s+");
            if (cols.length < 6 || !cols[4].matches("\\d+%")) throw new IllegalArgumentException();
            int percent = Integer.parseInt(cols[4].replace("%", ""));
            if (percent > 100) throw new IllegalArgumentException();
            return new UserCapacityCode.Disk(cols[1], cols[2], percent);
        });
        var a = mock(UserAuthCode.class);
        when(a.encode(anyString(), any())).thenAnswer(call ->
            ((PasswordEncoder) call.getArgument(1)).encode(call.getArgument(0))
        );
        when(a.matches(any(), any(), any())).thenAnswer(call -> {
            String raw = call.getArgument(0),
                encoded = call.getArgument(1);
            PasswordEncoder encoder = call.getArgument(2);
            return (
                raw != null &&
                encoded != null &&
                !encoded.isEmpty() &&
                encoder.matches(raw, encoded)
            );
        });
        var b = mock(UserBoardCode.class);
        when(b.page(anyInt(), anyInt())).thenAnswer(call -> {
            int page = call.getArgument(0),
                size = call.getArgument(1);
            if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException();
            return PageRequest.of(page, size, Sort.Direction.DESC, "id");
        });
        var f = mock(UserFilesCode.class);
        when(f.allowed(any(), anyLong())).thenAnswer(call -> {
            String name = call.getArgument(0);
            long bytes = call.getArgument(1);
            return (
                name != null &&
                !name.isBlank() &&
                !name.contains("/") &&
                !name.contains("\\") &&
                name.toLowerCase(Locale.ROOT).matches(".+\\.(png|jpg|jpeg|pdf|txt)") &&
                bytes > 0 &&
                bytes <= 5242880
            );
        });
        var t = mock(UserCommentsCode.class);
        when(t.threads(anyList(), anyLong())).thenAnswer(call -> {
            List<UserCommentsCode.Row> rows = call.getArgument(0);
            long board = call.getArgument(1);
            return rows
                .stream()
                .filter(r -> r.boardId() == board && r.parentId() == null)
                .sorted(Comparator.comparingLong(UserCommentsCode.Row::id))
                .map(root ->
                    new UserCommentsCode.Thread(
                        root,
                        rows
                            .stream()
                            .filter(
                                r -> r.boardId() == board && Objects.equals(r.parentId(), root.id())
                            )
                            .sorted(Comparator.comparingLong(UserCommentsCode.Row::id))
                            .toList()
                    )
                )
                .toList();
        });
        var practice = create(p, i, g, c, a, b, f, t);
        for (String id : IDS)
            assertTrue(practice.inspect(id).ready(), () ->
                practice.inspect(id).checks().toString()
            );
        // Each run must rollback its temporary table/index, including on pooled connections.
        assertTrue(practice.inspect("index-tuning").ready());
        // A wrong SQL must be caught even if a named index is created.
        when(i.sumSql()).thenReturn(
            "SELECT COALESCE(SUM(amount),0) AS total FROM practice_orders WHERE id = ?"
        );
        assertFalse(practice.inspect("index-tuning").ready());
        when(g.shouldApply(anyLong(), anyLong())).thenReturn(true);
        assertFalse(practice.inspect("gw-sync").ready());
    }
}
