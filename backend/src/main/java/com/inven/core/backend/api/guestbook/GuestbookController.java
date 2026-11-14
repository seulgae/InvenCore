package com.inven.core.backend.api.guestbook;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guestbook")
public class GuestbookController {

    private final GuestbookService service;

    public GuestbookController(GuestbookService service) {
        this.service = service;
    }

    public record WriteEntry(
        @NotBlank @Size(max = 20) String nickname,
        @NotBlank @Size(max = 500) String message,
        @NotBlank @Pattern(regexp = "sprout|cat|robot|cloud|coffee|star") String avatar
    ) {}

    @GetMapping
    public GuestbookService.Entries list(
        @RequestParam(name = "page", defaultValue = "0") int page
    ) {
        return service.list(page);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GuestbookService.Entry create(@Valid @RequestBody WriteEntry entry) {
        return service.create(entry.nickname(), entry.message(), entry.avatar());
    }
}
