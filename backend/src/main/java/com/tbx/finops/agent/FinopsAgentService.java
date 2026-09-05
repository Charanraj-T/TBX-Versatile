package com.tbx.finops.agent;

import com.tbx.finops.confidence.ConfidenceEngine;
import com.tbx.finops.confidence.ConfidenceResult;
import com.tbx.finops.conversation.ConversationHistoryService;
import com.tbx.finops.model.ChatResponse;
import com.tbx.finops.model.FinancialResponse;
import com.tbx.finops.validation.ValidationStatus;
import io.micrometer.tracing.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FinopsAgentService {

    private static final Logger log = LoggerFactory.getLogger(FinopsAgentService.class);

    private final String aiProvider;
    private final String langfuseBaseUrl;
    private final SarvamAgentService sarvamAgentService;
    private final GroqAgentService groqAgentService;
    private final OpenRouterAgentService openRouterAgentService;
    private final ConversationHistoryService conversationHistoryService;
    private final ConfidenceEngine confidenceEngine;
    private final Tracer tracer;

    public FinopsAgentService(
            @Value("${app.ai.provider:openrouter}") String aiProvider,
            @Value("${app.langfuse.base-url:https://cloud.langfuse.com}") String langfuseBaseUrl,
            SarvamAgentService sarvamAgentService,
            GroqAgentService groqAgentService,
            OpenRouterAgentService openRouterAgentService,
            ConversationHistoryService conversationHistoryService,
            ConfidenceEngine confidenceEngine,
            @Autowired(required = false) Tracer tracer) {
        this.aiProvider = aiProvider.trim().toLowerCase();
        this.langfuseBaseUrl = langfuseBaseUrl;
        this.sarvamAgentService = sarvamAgentService;
        this.groqAgentService = groqAgentService;
        this.openRouterAgentService = openRouterAgentService;
        this.conversationHistoryService = conversationHistoryService;
        this.confidenceEngine = confidenceEngine;
        this.tracer = tracer;
        log.info("FinopsAgentService initialized with active provider: '{}'", this.aiProvider);
    }

    public FinancialResponse processQuery(String userQuestion, String conversationId) {
        long startTime = System.currentTimeMillis();
        String traceId = (tracer != null && tracer.currentSpan() != null)
                ? tracer.currentSpan().context().traceId()
                : UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        MDC.put("correlationId", traceId);

        try {
            if (conversationId == null || conversationId.isBlank()) {
                conversationId = UUID.randomUUID().toString();
            }

            log.info("Incoming FinOps user question: '{}' (conversationId: {})", userQuestion, conversationId);

            conversationHistoryService.append(conversationId, "user", userQuestion);
            List<Map<String, String>> history = conversationHistoryService.findRecent(conversationId);

            ChatResponse chatResponse = null;
            if ("groq".equals(aiProvider)) {
                log.info("Routing query to Groq LLM agent");
                chatResponse = groqAgentService.process(userQuestion, history);
            } else if ("sarvam".equals(aiProvider)) {
                log.info("Routing query to Sarvam LLM agent");
                chatResponse = sarvamAgentService.process(userQuestion, history);
            } else {
                log.info("Routing query to OpenRouter LLM agent");
                chatResponse = openRouterAgentService.process(userQuestion, history);
            }

            if (chatResponse != null) {
                conversationHistoryService.append(conversationId, "assistant", chatResponse.answer());
                log.info("Finished processing question with provider '{}', validation status: {}",
                        chatResponse.provider(),
                        chatResponse.evidence() != null ? chatResponse.evidence().validationStatus() : "NONE");
            } else {
                log.warn("LLM agent returned null response for conversation '{}'", conversationId);
                throw new IllegalStateException("The AI provider returned no response for the query. Please retry.");
            }

            // Build Confidence block
            ConfidenceResult confResult = confidenceEngine.evaluate(chatResponse);
            FinancialResponse.ConfidenceInfo confidenceInfo = new FinancialResponse.ConfidenceInfo(
                    confResult.score(), confResult.grade(), confResult.badgeText(), confResult.disclaimer());

            // Evidence block
            boolean verified = chatResponse.evidence() != null
                    && chatResponse.evidence().validationStatus() == ValidationStatus.VERIFIED;
            String toolExec = chatResponse.evidence() != null ? chatResponse.evidence().tool() : null;
            String sqlQ = chatResponse.evidence().calculation();
            if (sqlQ == null || sqlQ.isBlank()) {
                sqlQ = chatResponse.evidence() != null ? chatResponse.evidence().sqlQuery() : null;
            }
            Map<String, Object> filters = chatResponse.evidence() != null ? chatResponse.evidence().filters()
                    : Map.of();
            int recordCount = chatResponse.evidence() != null && chatResponse.evidence().recordCount() != null
                    ? chatResponse.evidence().recordCount()
                    : 0;
            Object rawResult = chatResponse.evidence() != null ? chatResponse.evidence().result() : null;
            long sqlExecutionMs = chatResponse.evidence() != null && chatResponse.evidence().executionTimeMs() > 0
                    ? chatResponse.evidence().executionTimeMs()
                    : (System.currentTimeMillis() - startTime);

            List<FinancialResponse.Citation> citations = buildCitations(rawResult);
            int tokens = chatResponse.tokensUsed() != null ? chatResponse.tokensUsed() : 0;
            long executionTimeMs = System.currentTimeMillis() - startTime;

            FinancialResponse.ModelEfficiency efficiency = new FinancialResponse.ModelEfficiency(
                    chatResponse.provider(), executionTimeMs, tokens, 0.0);

            FinancialResponse.EvidenceDetail evidenceDetail = new FinancialResponse.EvidenceDetail(
                    verified, toolExec, sqlQ, filters, sqlExecutionMs, recordCount, citations, efficiency);

            FinancialResponse.Answer answer = new FinancialResponse.Answer(
                    chatResponse.answer(), "");

            FinancialResponse.AnomalyInfo anomalyInfo = buildAnomaly("detect_anomalies".equals(toolExec), rawResult);
            String langfuseUrl = langfuseBaseUrl + "/project/trace/" + traceId;

            return new FinancialResponse(
                    conversationId,
                    traceId,
                    langfuseUrl,
                    answer,
                    confidenceInfo,
                    anomalyInfo,
                    evidenceDetail,
                    normalizeRecords(rawResult));

        } finally {
            MDC.remove("correlationId");
        }
    }

    public ChatResponse processQueryLegacy(String userQuestion) {
        String sessionId = UUID.randomUUID().toString();
        String correlationId = sessionId.substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            log.info("Incoming legacy FinOps user question: '{}'", userQuestion);

            ChatResponse response = null;
            if ("openrouter".equals(aiProvider)) {
                log.info("Routing query to OpenRouter LLM agent");
                response = openRouterAgentService.process(userQuestion, List.of());
            } else if ("sarvam".equals(aiProvider)) {
                log.info("Routing query to Sarvam LLM agent");
                response = sarvamAgentService.process(userQuestion, List.of());
            } else {
                log.info("Routing query to Groq LLM agent");
                response = groqAgentService.process(userQuestion, List.of());
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

    @SuppressWarnings("unchecked")
    private List<FinancialResponse.Citation> buildCitations(Object rawResult) {
        List<Map<String, Object>> rows = extractRowList(rawResult);
        List<FinancialResponse.Citation> citations = new ArrayList<>();
        int max = Math.min(rows.size(), 8);
        for (int i = 0; i < max; i++) {
            Map<String, Object> row = rows.get(i);
            Object sourceId = firstNonNull(
                    row.get("transaction_reference_id"),
                    row.get("account_number_masked"),
                    row.get("bank_name"),
                    row.get("bank_code"),
                    row.get("transaction_id"),
                    row.get("account_id"),
                    row.get("month"));
            Object amountObj = firstNonNull(
                    row.get("transaction_amount"),
                    row.get("available_balance"),
                    row.get("total_spend"),
                    row.get("total_available_balance"),
                    row.get("net_flow"),
                    row.get("total_debits_amount"),
                    row.get("discrepancy"),
                    row.get("period1_total"));
            Object dateObj = firstNonNull(
                    row.get("transaction_date"),
                    row.get("month"),
                    row.get("last_transaction_date"),
                    row.get("oldest_unreconciled_date"));

            String ref = sourceId != null ? String.valueOf(sourceId) : "Record #" + (i + 1);
            String date = dateObj != null ? String.valueOf(dateObj) : "";
            String amount = "";
            if (amountObj != null) {
                try {
                    double val = Double.parseDouble(String.valueOf(amountObj));
                    amount = formatInr(val);
                } catch (Exception e) {
                    amount = String.valueOf(amountObj);
                }
            }

            citations.add(new FinancialResponse.Citation(ref, date, amount, ref));
        }
        return citations;
    }

    private FinancialResponse.AnomalyInfo buildAnomaly(boolean isAnomalyTool, Object rawResult) {
        if (!isAnomalyTool) {
            return new FinancialResponse.AnomalyInfo(false, "");
        }
        List<Map<String, Object>> rows = extractRowList(rawResult);
        List<Map<String, Object>> anomalies = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object flag = row.get("is_anomaly");
            if (flag instanceof Boolean bool && bool) {
                anomalies.add(row);
            }
        }
        if (anomalies.isEmpty()) {
            return new FinancialResponse.AnomalyInfo(false,
                    "No anomalous transactions detected in the analysis window.");
        }
        Object top = anomalies.get(0).get("transaction_amount");
        String topAmount = top != null ? formatInr(Double.parseDouble(String.valueOf(top))) : "N/A";
        return new FinancialResponse.AnomalyInfo(
                true,
                "Detected " + anomalies.size()
                        + " anomalous debit transaction(s) exceeding 2.5σ above the historical mean. Largest outlier: ₹"
                        + topAmount + ".");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizeRecords(Object rawResult) {
        return extractRowList(rawResult);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractRowList(Object rawResult) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (rawResult instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object detail = ((Map<String, Object>) map).get("detail_rows");
                    if (detail instanceof List<?> detailList) {
                        for (Object detailItem : detailList) {
                            if (detailItem instanceof Map<?, ?> inner) {
                                rows.add((Map<String, Object>) inner);
                            }
                        }
                    } else {
                        rows.add((Map<String, Object>) map);
                    }
                }
            }
        } else if (rawResult instanceof Map<?, ?> map) {
            Object detail = ((Map<String, Object>) map).get("detail_rows");
            if (detail instanceof List<?> detailList) {
                for (Object item : detailList) {
                    if (item instanceof Map<?, ?> inner) {
                        rows.add((Map<String, Object>) inner);
                    }
                }
            } else {
                rows.add((Map<String, Object>) map);
            }
        }
        return rows;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null)
                return value;
        }
        return null;
    }

    private String formatInr(double amount) {
        return String.format("%,.2f", amount);
    }
}
