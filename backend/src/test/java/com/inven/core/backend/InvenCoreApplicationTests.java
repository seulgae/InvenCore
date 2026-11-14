package com.inven.core.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "gw-sync.enabled=false")
class InvenCoreApplicationTests extends PostgreSqlIntegrationTest {

    @Test
    void contextLoads() {}
}
