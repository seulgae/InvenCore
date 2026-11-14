package com.inven.core.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** 방명록을 실제 보안 필터와 PostgreSQL을 함께 사용해 검사합니다. */
@SpringBootTest(properties = { "gw-sync.enabled=false", "benchmark.rows=1000" })
@AutoConfigureMockMvc
class GuestbookIntegrationTests extends PostgreSqlIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Test
    void anonymousCanWriteAndReadGuestbookWhileHostMetricsStayProtected() throws Exception {
        mvc.perform(
            post("/api/guestbook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"nickname\":\"통합 방문자\",\"message\":\"안녕하세요 🌱\",\"avatar\":\"sprout\"}"
                )
        )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.message").value("안녕하세요 🌱"));
        mvc.perform(get("/api/guestbook"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].nickname").value("통합 방문자"));
        mvc.perform(get("/api/server-capacity/host")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/guestbook")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidAnonymousWritesReturnValidationError() throws Exception {
        mvc.perform(
            post("/api/guestbook").contentType(MediaType.APPLICATION_JSON).content("{}")
        ).andExpect(status().isBadRequest());
    }
}
