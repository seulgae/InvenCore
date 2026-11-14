package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.inven.core.backend.api.serverCapacity.service.HostCapacityClient;
import java.io.IOException;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ServerSocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 실제 Unix 소켓의 프로토콜·응답 크기·무응답 제한을 검사합니다. */
class HostCapacityClientTests {

    @BeforeEach
    void requireUnixSocketSupport() throws Exception {
        try (var supported = ServerSocketChannel.open(StandardProtocolFamily.UNIX)) {
            assertTrue(supported.isOpen());
        } catch (UnsupportedOperationException unavailable) {
            assumeTrue(false, "Unix sockets unavailable on this platform");
        }
    }

    private String exchange(String response, boolean stall) throws Exception {
        Path directory = Files.createTempDirectory("ic-");
        Path socket = directory.resolve("q.sock");
        var worker = Executors.newSingleThreadExecutor();
        try (var server = ServerSocketChannel.open(StandardProtocolFamily.UNIX)) {
            server.bind(UnixDomainSocketAddress.of(socket));
            var handled = worker.submit(() -> {
                try (var connection = server.accept()) {
                    var command = ByteBuffer.allocate(11);
                    while (command.hasRemaining() && connection.read(command) >= 0) {}
                    assertEquals(
                        "CAPACITY/1\n",
                        new String(
                            command.array(),
                            0,
                            command.position(),
                            StandardCharsets.US_ASCII
                        )
                    );
                    if (stall) Thread.sleep(1000);
                    else {
                        var bytes = ByteBuffer.wrap(response.getBytes(StandardCharsets.UTF_8));
                        while (bytes.hasRemaining()) connection.write(bytes);
                    }
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                } catch (IOException closed) {
                    // Client disconnects after detecting an oversized or incomplete reply.
                }
                return null;
            });
            try {
                return new HostCapacityClient(
                    socket,
                    Duration.ofMillis(stall ? 500 : 2000)
                ).request();
            } finally {
                handled.get(3, TimeUnit.SECONDS);
            }
        } finally {
            worker.shutdownNow();
            Files.deleteIfExists(socket);
            Files.deleteIfExists(directory);
        }
    }

    @Test
    void readsOnlyACompleteReply() throws Exception {
        assertEquals("{\"schemaVersion\":1}", exchange("{\"schemaVersion\":1}\n", false));
    }

    @Test
    void rejectsOversizedAndTruncatedReplies() {
        assertThrows(IOException.class, () -> exchange("x".repeat(9000), false));
        assertThrows(IOException.class, () -> exchange("{\"schemaVersion\":1}", false));
    }

    @Test
    void unresponsiveHostHasABoundedDeadline() {
        assertThrows(IOException.class, () -> exchange("", true));
    }
}
