package com.inven.core.backend.api.guestbook;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "guestbook_entries")
public class GuestbookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 12)
    private String avatar;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected GuestbookEntry() {}

    public GuestbookEntry(String nickname, String message, String avatar) {
        this.nickname = nickname;
        this.message = message;
        this.avatar = avatar;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public String getMessage() {
        return message;
    }

    public String getAvatar() {
        return avatar;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
