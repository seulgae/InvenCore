package com.inven.core.backend.api.gwsync.config;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@ConfigurationProperties(prefix = "gw-sync")
@Validated
@Getter
@Setter
public class GwSyncProperties {

    public enum Mode {
        LOCAL,
        EXTERNAL,
    }

    private boolean enabled = true;

    @NotNull
    private Mode mode = Mode.LOCAL;

    @NotBlank
    private String topic = "invencore.gw.changed.v1";

    @Min(1)
    @Max(3600)
    private long cacheTtlSeconds = 60;
}
