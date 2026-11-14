package com.inven.core.backend.api.serverCapacity.service;

import java.io.IOException;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** 호스트의 고정 조회 소켓만 호출합니다. URL·명령·파일 경로를 사용자에게서 받지 않습니다. */
@Component
public class HostCapacityClient {

    private final Path socket;
    private final Duration timeout;

    @Autowired
    public HostCapacityClient(
        @Value("${server-capacity.host-socket:/run/invencore-host/capacity.sock}") String socket
    ) {
        this(Path.of(socket), Duration.ofSeconds(5));
    }

    public HostCapacityClient(Path socket, Duration timeout) {
        this.socket = socket;
        this.timeout = timeout;
    }

    /** 연결·쓰기·읽기를 합쳐 제한 시간을 적용하고 응답은 최대 8KiB로 제한합니다. */
    public String request() throws IOException {
        long deadline = System.nanoTime() + timeout.toNanos();
        try (
            var channel = SocketChannel.open(StandardProtocolFamily.UNIX);
            var selector = Selector.open()
        ) {
            channel.configureBlocking(false);
            var key = channel.register(selector, SelectionKey.OP_CONNECT);
            channel.connect(UnixDomainSocketAddress.of(socket));
            while (!channel.finishConnect())
                waitFor(selector, key, SelectionKey.OP_CONNECT, deadline);
            var command = ByteBuffer.wrap("CAPACITY/1\n".getBytes(StandardCharsets.US_ASCII));
            while (command.hasRemaining()) {
                if (channel.write(command) == 0) waitFor(
                    selector,
                    key,
                    SelectionKey.OP_WRITE,
                    deadline
                );
            }
            var response = ByteBuffer.allocate(8193);
            int scanned = 0;
            while (response.hasRemaining()) {
                int count = channel.read(response);
                if (count < 0) throw new IOException("Incomplete host response");
                while (scanned < response.position()) {
                    if (response.get(scanned++) == '\n') {
                        return new String(response.array(), 0, scanned - 1, StandardCharsets.UTF_8);
                    }
                }
                if (count == 0) waitFor(selector, key, SelectionKey.OP_READ, deadline);
                if (System.nanoTime() >= deadline) throw new IOException("Host request timed out");
            }
            throw new IOException("Host response too large");
        }
    }

    private void waitFor(Selector selector, SelectionKey key, int operation, long deadline)
        throws IOException {
        long remaining = deadline - System.nanoTime();
        if (remaining <= 0) throw new IOException("Host request timed out");
        key.interestOps(operation);
        selector.select(Math.max(1, Duration.ofNanos(remaining).toMillis()));
        selector.selectedKeys().clear();
    }
}
