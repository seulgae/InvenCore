package com.inven.core.backend.api.gwsync.config;

import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.time.Clock;

@Configuration
@EnableScheduling
public class GwSyncConfig {
    @Bean public Clock gwCacheClock() { return Clock.systemUTC(); }
}
