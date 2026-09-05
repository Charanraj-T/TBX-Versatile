package com.tbx.finops.conversation;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ConversationHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ConversationHistoryService.class);

    private final JdbcTemplate jdbcTemplate;
    private final int maxHistoryMessages;

    public ConversationHistoryService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.ai.history-window-messages:12}") int maxHistoryMessages) {
        this.jdbcTemplate = jdbcTemplate;
        this.maxHistoryMessages = Math.max(2, maxHistoryMessages);
    }

    @PostConstruct
    public void ensureTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS conversation_history (
                        id BIGSERIAL PRIMARY KEY,
                        session_id VARCHAR(64) NOT NULL,
                        role VARCHAR(16) NOT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id
                    ON conversation_history(session_id, id)
                    """);
            log.info("Conversation history table ensured.");
        } catch (Exception e) {
            log.warn("Could not ensure conversation history table: {}", e.getMessage());
        }
    }

    public void append(String sessionId, String role, String content) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO conversation_history (session_id, role, content) VALUES (?, ?, ?)",
                    sessionId, role, content);
        } catch (Exception e) {
            log.warn("Failed to append conversation message: {}", e.getMessage());
        }
    }

    public List<Map<String, String>> findRecent(String sessionId) {
        try {
            return jdbcTemplate.query(
                    """
                    SELECT role, content FROM (
                        SELECT role, content, id
                        FROM conversation_history
                        WHERE session_id = ?
                        ORDER BY id DESC
                        LIMIT ?
                    ) recent
                    ORDER BY id ASC
                    """,
                    (rs, rowNum) -> Map.of(
                            "role", rs.getString("role"),
                            "content", rs.getString("content")),
                    sessionId, maxHistoryMessages);
        } catch (Exception e) {
            log.warn("Failed to load conversation history: {}", e.getMessage());
            return List.of();
        }
    }

    public void clear(String sessionId) {
        try {
            jdbcTemplate.update("DELETE FROM conversation_history WHERE session_id = ?", sessionId);
        } catch (Exception e) {
            log.warn("Failed to clear conversation history: {}", e.getMessage());
        }
    }
}