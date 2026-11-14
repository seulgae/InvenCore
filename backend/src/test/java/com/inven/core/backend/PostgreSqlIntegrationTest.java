package com.inven.core.backend;

import java.sql.DriverManager;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Real PostgreSQL only. Every Spring context and standalone SQL fixture gets its own schema. */
abstract class PostgreSqlIntegrationTest {

    private static final String TEST_JWT_SECRET = UUID.randomUUID().toString() + UUID.randomUUID();

    private static final class Database {

        static final PostgreSQLContainer INSTANCE = start();

        private static PostgreSQLContainer start() {
            var container = new PostgreSQLContainer("postgres:18-alpine");
            container.start();
            return container;
        }
    }

    static DataSource dataSource() {
        var db = Database.INSTANCE;
        String schema = "test_" + UUID.randomUUID().toString().replace("-", "");
        try (
            var connection = DriverManager.getConnection(
                db.getJdbcUrl(),
                db.getUsername(),
                db.getPassword()
            );
            var statement = connection.createStatement()
        ) {
            statement.execute("CREATE SCHEMA " + schema);
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException("Cannot create isolated PostgreSQL test schema", e);
        }
        String separator = db.getJdbcUrl().contains("?") ? "&" : "?";
        return new DriverManagerDataSource(
            db.getJdbcUrl() + separator + "currentSchema=" + schema,
            db.getUsername(),
            db.getPassword()
        );
    }

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        registry.add("jwt.secret", () -> TEST_JWT_SECRET);
        var source = (DriverManagerDataSource) dataSource();
        registry.add("spring.datasource.url", source::getUrl);
        registry.add("spring.datasource.username", source::getUsername);
        registry.add("spring.datasource.password", source::getPassword);
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "4");
        registry.add("spring.datasource.hikari.minimum-idle", () -> "1");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("benchmark.rows", () -> "2000");
    }
}
