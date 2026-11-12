package com.inven.core.backend;

import com.inven.core.backend.api.benchmark.BenchmarkService;
import com.inven.core.backend.api.benchmark.BenchmarkResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
 properties = {"benchmark.rows=2000", "spring.datasource.url=jdbc:h2:mem:benchmark-tests;DB_CLOSE_DELAY=-1"})
class BenchmarkTests {
    @Autowired BenchmarkService service;
    @LocalServerPort int port;

    @Test void seedsOnStartupAndReusesSameDataset() {
        assertTrue(service.status().ready());
        assertEquals(2000, service.status().rowsPerTable());
        service.initialize();
        assertEquals(2000, service.status().rowsPerTable());
    }

    @Test void sequentialAndParallelResultsAreEquivalent() {
        var comparison = service.streams();
        verify(comparison);
        assertEquals(1, comparison.operationsPerSample());
    }

    @Test void indexedQueryHasSameResultAndUsesCompositeIndex() {
        var comparison = service.indexes();
        verify(comparison);
        assertTrue(comparison.optimizedPlan().toUpperCase().contains("IDX_BENCH_ACCOUNT_STATE"));
        assertFalse(comparison.baselinePlan().toUpperCase().contains("IDX_BENCH_ACCOUNT_STATE"));
        assertTrue(comparison.baselinePlan().contains("scanCount"));
        assertEquals(8, comparison.operationsPerSample());
    }

    @Test void publicApiAndConcurrentRunGuard() throws Exception {
        var client = HttpClient.newHttpClient();
        URI base = URI.create("http://localhost:" + port + "/api/benchmarks");
        assertEquals(200, client.send(HttpRequest.newBuilder(base).GET().build(), HttpResponse.BodyHandlers.ofString()).statusCode());
        assertTrue(service.tryAcquire());
        try {
            var response = client.send(HttpRequest.newBuilder(URI.create(base + "/streams")).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(409, response.statusCode());
        } finally { service.release(); }
        var success = client.send(HttpRequest.newBuilder(URI.create(base + "/streams")).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, success.statusCode());
        assertTrue(success.body().contains("resultsMatch"));
        assertEquals(400, client.send(HttpRequest.newBuilder(URI.create(base + "/unsupported")).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString()).statusCode());
    }

    private void verify(BenchmarkResult.Comparison result) {
        assertTrue(result.resultsMatch());
        assertEquals(result.baseline().checksum(), result.optimized().checksum());
        assertNotEquals("0", result.baseline().checksum());
        assertEquals(5, result.baseline().samplesMs().size());
        assertEquals(5, result.optimized().samplesMs().size());
        assertTrue(result.baseline().medianMs() > 0);
        assertTrue(result.optimized().medianMs() > 0);
        assertTrue(Double.isFinite(result.speedup()));
        // Never assert that parallelization or indexing must be faster.
    }
}
