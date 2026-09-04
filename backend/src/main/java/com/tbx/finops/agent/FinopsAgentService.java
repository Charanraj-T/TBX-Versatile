package com.tbx.finops.agent;

import com.tbx.finops.model.ChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class FinopsAgentService {

    private static final Logger log = LoggerFactory.getLogger(FinopsAgentService.class);

    private final String aiProvider;
    private final SarvamAgentService sarvamAgentService;
    private final GroqAgentService groqAgentService;

    public FinopsAgentService(
            @Value("${app.ai.provider:groq}") String aiProvider,
            SarvamAgentService sarvamAgentService,
            GroqAgentService groqAgentService) {
        this.aiProvider = aiProvider.trim().toLowerCase();
        this.sarvamAgentService = sarvamAgentService;
        this.groqAgentService = groqAgentService;
        log.info("FinopsAgentService initialized with active provider: '{}'", this.aiProvider);
    }

    public ChatResponse processQuery(String userQuestion) {
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            log.info("Incoming FinOps user question: '{}'", userQuestion);

            ChatResponse response;
            if ("sarvam".equals(aiProvider)) {
                log.info("Routing query to Sarvam LLM agent");
                response = sarvamAgentService.process(userQuestion);
            } else {
                log.info("Routing query to Groq LLM agent");
                response = groqAgentService.process(userQuestion);
            }

            log.info("Finished processing question with provider '{}', validation status: {}",
                    response.provider(),
                    response.evidence() != null ? response.evidence().validationStatus() : "NONE");

            return response;
        } finally {
            MDC.remove("correlationId");
        }
    }

    public String getActiveProvider() {
        return aiProvider;
    }

    public boolean isLlmConfigured() {
        if ("sarvam".equals(aiProvider)) {
            return sarvamAgentService.isConfigured();
        }
        return groqAgentService.isConfigured();
    }
}
