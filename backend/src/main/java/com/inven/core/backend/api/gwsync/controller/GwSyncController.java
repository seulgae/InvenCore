package com.inven.core.backend.api.gwsync.controller;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import com.inven.core.backend.api.gwsync.dto.GwSyncDto.*;
import com.inven.core.backend.api.gwsync.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/gw-sync") @RequiredArgsConstructor
public class GwSyncController {
    private final GwSourceService sources;
    private final GwQueryService queries;
    private final GwSyncProperties properties;

    @GetMapping("/status")
    public Status configuration() {
        boolean local = properties.getMode() == GwSyncProperties.Mode.LOCAL;
        return new Status(properties.isEnabled(), properties.getMode().name(),
                local ? "SPRING_EVENTS" : "KAFKA", local ? "MEMORY" : "REDIS",
                local ? null : properties.getTopic(), local ? null : properties.getTopic() + ".DLT", properties.getCacheTtlSeconds());
    }
    @GetMapping("/items") public List<Source> recent() { return sources.recent(); }
    @GetMapping("/items/{id}") public State inspect(@PathVariable String id) { return queries.inspect(id); }
    @PostMapping("/items") @ResponseStatus(HttpStatus.CREATED)
    public Source create(@Valid @RequestBody Input input) { return sources.create(input); }
    @PutMapping("/items/{id}")
    public Source update(@PathVariable String id, @Valid @RequestBody Input input) { return sources.update(id, input); }
    @DeleteMapping("/items/{id}")
    public Source delete(@PathVariable String id) { return sources.delete(id); }
}
