package com.inven.core.backend.api.guestbook;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestbookRepository extends JpaRepository<GuestbookEntry, Long> {}
