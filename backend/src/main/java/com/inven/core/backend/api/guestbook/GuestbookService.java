package com.inven.core.backend.api.guestbook;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class GuestbookService {

    private static final Set<String> AVATARS = Set.of(
        "sprout",
        "cat",
        "robot",
        "cloud",
        "coffee",
        "star"
    );
    private final GuestbookRepository repository;

    public GuestbookService(GuestbookRepository repository) {
        this.repository = repository;
    }

    public record Entry(
        Long id,
        String nickname,
        String message,
        String avatar,
        Instant createdAt
    ) {
        static Entry from(GuestbookEntry entry) {
            return new Entry(
                entry.getId(),
                entry.getNickname(),
                entry.getMessage(),
                entry.getAvatar(),
                entry.getCreatedAt()
            );
        }
    }

    public record Entries(List<Entry> content, long totalElements, int totalPages, int number) {}

    public Entries list(int page) {
        if (page < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page");
        var result = repository.findAll(
            PageRequest.of(page, 8, Sort.by(Sort.Direction.DESC, "id"))
        );
        return new Entries(
            result.getContent().stream().map(Entry::from).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.getNumber()
        );
    }

    @Transactional
    public Entry create(String nickname, String message, String avatar) {
        if (
            nickname == null ||
            message == null ||
            nickname.strip().isBlank() ||
            message.strip().isBlank() ||
            nickname.length() > 20 ||
            message.length() > 500 ||
            !AVATARS.contains(avatar == null ? "" : avatar)
        ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid guestbook entry");
        }
        return Entry.from(
            repository.save(new GuestbookEntry(nickname.strip(), message.strip(), avatar))
        );
    }
}
