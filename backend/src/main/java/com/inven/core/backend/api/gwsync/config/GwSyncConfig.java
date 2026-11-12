package com.inven.core.backend.api.gwsync.config;

import java.time.Clock;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class GwSyncConfig {

    /**
     * 로컬 캐시의 만료 시각 계산에 사용할 UTC 시계를 제공합니다.
     */
    @Bean
    public Clock gwCacheClock() {
        return Clock.systemUTC();
    }
}
