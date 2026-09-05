package com.tbx.finops.agent;

import com.tbx.finops.conversation.ConversationHistoryService;
import com.tbx.finops.model.ChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FinopsAgentService {

    private static final Logger log = LoggerFactory.getLogger(FinopsAgentService.class);

    private final String aiProvider;
    private final SarvamAgentService sarvamAgentService;
    private final GroqAgentService groqAgentService;
    private final OpenRouterAgentService openRouterAgentService;
    private final ConversationHistoryService conversationHistoryService;

    public FinopsAgentService(
            @Value("${app.ai.provider:groq}") String aiProvider,
            SarvamAgentService sarvamAgentService,
            GroqAgentService groqAgentService,
            OpenRouterAgentService openRouterAgentService,
            ConversationHistoryService conversationHistoryService) {
        this.aiProvider = aiProvider.trim().toLowerCase();
        this.sarvamAgentService = sarvamAgentService;
        this.groqAgentService = groqAgentService;
        this.openRouterAgentService = openRouterAgentService;
        this.conversationHistoryService = conversationHistoryService;
        log.info("FinopsAgentService initialized with active provider: '{}'", this.aiProvider);
    }

    public ChatResponse processQuery(String userQuestion, String sessionId) {
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        boolean hasSession = sessionId != null && !sessionId.isBlank();

        try {
            log.info("Incoming FinOps user question: '{}' (sessionId: {})", userQuestion, hasSession ? sessionId : "NONE");

            if (hasSession) {
                conversationHistoryService.append(sessionId, "user", userQuestion);
            }
            List<Map<String, String>> history = hasSession
                    ? conversationHistoryService.findRecent(sessionId)
                    : List.of();

            ChatResponse response = null;
            if ("openrouter".equals(aiProvider)) {
                log.info("Routing query to OpenRouter LLM agent");
                response = openRouterAgentService.process(userQuestion, history);
            } else if ("sarvam".equals(aiProvider)) {
                log.info("Routing query to Sarvam LLM agent");
                response = sarvamAgentService.process(userQuestion, history);
            } else {
                log.info("Routing query to Groq LLM agent");
                response = groqAgentService.process(userQuestion, history);
            }

            if (response != null) {
                if (hasSession) {
                    conversationHistoryService.append(sessionId, "assistant", response.answer());
                }
                log.info("Finished processing question with provider '{}', validation status: {}",
                        response.provider(),
                        response.evidence() != null ? response.evidence().validationStatus() : "NONE");
            } else {
                log.warn("Finished processing question but received null response");
            }

            return response;
        } finally {
            MDC.remove("correlationId");
        }
    }

    public String getActiveProvider() {
        return aiProvider;
    }

    public boolean isLlmConfigured() {
        if ("openrouter".equals(aiProvider)) {
            return openRouterAgentService.isConfigured();
        }
        if ("sarvam".equals(aiProvider)) {
            return sarvamAgentService.isConfigured();
        }
        return groqAgentService.isConfigured();
    }
}
