package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.comment.entity.Comment;
import com.inven.core.backend.api.member.entity.Member;
import com.inven.core.backend.api.requestboard.entity.RequestBoard;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"gw-sync.enabled=false", "benchmark.rows=2000"})
class PostgreSqlPersistenceTests extends PostgreSqlIntegrationTest {
    @Autowired EntityManagerFactory factory;

    @Test
    void identityUnicodeTextAndTimestampsSurviveNewConnection() {
        String content = "한글 본문과 이모지 📦\n".repeat(1000);
        Long memberId;
        Long boardId;
        Long commentId;
        try (var em = factory.createEntityManager()) {
            em.getTransaction().begin();
            var member = Member.builder().username("postgres-persistence").password("hash").build();
            em.persist(member);
            var board = RequestBoard.builder().title("PostgreSQL 저장 검증")
                .content(content).author(member.getUsername()).build();
            em.persist(board);
            var comment = Comment.builder().requestBoardId(board.getId())
                .content(content).author(member.getUsername()).build();
            em.persist(comment);
            em.getTransaction().commit();
            memberId = member.getId();
            boardId = board.getId();
            commentId = comment.getId();
        }
        try (var em = factory.createEntityManager()) {
            assertNotNull(memberId);
            assertEquals(1, em.find(Member.class, memberId).getRole());
            var board = em.find(RequestBoard.class, boardId);
            assertEquals(content, board.getContent());
            assertNotNull(board.getCreatedAt());
            var comment = em.find(Comment.class, commentId);
            assertEquals(boardId, comment.getRequestBoardId());
            assertNull(comment.getParentId());
            assertEquals(content, comment.getContent());
            assertNotNull(comment.getCreatedAt());
        }
    }
}
