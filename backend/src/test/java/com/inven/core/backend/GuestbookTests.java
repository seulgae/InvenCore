package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.inven.core.backend.api.guestbook.*;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

class GuestbookTests {
    GuestbookRepository repository;
    java.util.ArrayList<GuestbookEntry> saved;
    java.util.function.Function<Pageable, PageImpl<GuestbookEntry>> findPage;
    GuestbookService service;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        saved = new java.util.ArrayList<>();
        findPage = pageable -> new PageImpl<>(List.of(), pageable, 0);
        repository = (GuestbookRepository) java.lang.reflect.Proxy.newProxyInstance(
            GuestbookRepository.class.getClassLoader(), new Class<?>[] { GuestbookRepository.class },
            (proxy, method, args) -> {
                if (method.getName().equals("save")) {
                    saved.add((GuestbookEntry) args[0]);
                    return args[0];
                }
                if (method.getName().equals("findAll")) return findPage.apply((Pageable) args[0]);
                throw new UnsupportedOperationException(method.getName());
            });
        service = new GuestbookService(repository);
        mvc = MockMvcBuilders.standaloneSetup(new GuestbookController(service)).build();

    }

    @Test
    void createsTrimmedEntryWithTimestamp() throws Exception {
        mvc.perform(post("/api/guestbook").contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\" Visitor \",\"message\":\" Hello <script> \",\"avatar\":\"cat\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nickname").value("Visitor"))
            .andExpect(jsonPath("$.message").value("Hello <script>"))
            .andExpect(jsonPath("$.avatar").value("cat"))
            .andExpect(jsonPath("$.createdAt").exists());
        assertEquals(1, saved.size());
    }

    @Test
    void rejectsBlankOversizedAndInvalidInputWithoutSaving() throws Exception {
        for (String body : List.of(
            "{\"nickname\":\" \",\"message\":\"hello\",\"avatar\":\"cat\"}",
            "{\"nickname\":\"visitor\",\"message\":\" \",\"avatar\":\"cat\"}",
            "{\"nickname\":\"visitor\",\"message\":\"hello\",\"avatar\":\"invalid\"}",
            "{\"nickname\":\"visitor\",\"message\":\"" + "a".repeat(501) + "\",\"avatar\":\"cat\"}",
            "{\"nickname\":\"" + "a".repeat(21) + "\",\"message\":\"hello\",\"avatar\":\"cat\"}")) {
            mvc.perform(post("/api/guestbook").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        }
        assertTrue(saved.isEmpty());
    }

    @Test
    void paginatesEightAtATimeInStableNewestFirstOrder() throws Exception {
        findPage = pageable -> {
            assertEquals(1, pageable.getPageNumber());
            assertEquals(8, pageable.getPageSize());
            assertTrue(pageable.getSort().getOrderFor("id").isDescending());
            return new PageImpl<>(List.of(new GuestbookEntry("visitor", "hello", "sprout")), pageable, 9);
        };
        mvc.perform(get("/api/guestbook?page=1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(9))
            .andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.number").value(1))
            .andExpect(jsonPath("$.content[0].message").value("hello"));
    }

    @Test
    void rejectsNegativePageAndUnicodeWhitespace() throws Exception {
        mvc.perform(get("/api/guestbook?page=-1")).andExpect(status().isBadRequest());
        assertThrows(ResponseStatusException.class, () -> service.create("\u2003", "hello", "cat"));
        assertTrue(saved.isEmpty());
    }
}
