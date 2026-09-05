package com.tbx.finops.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tbx.finops.evidence.EvidenceBuilder;
import com.tbx.finops.evidence.EvidenceObject;
import com.tbx.finops.mcp.McpClientService;
import com.tbx.finops.mcp.McpToolDefinition;
import com.tbx.finops.mcp.McpToolExecutionResult;
import com.tbx.finops.mcp.ToolSqlRegistry;
import com.tbx.finops.model.ChatResponse;
import com.tbx.finops.validation.ValidationEngine;
import com.tbx.finops.validation.ValidationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
public class SarvamAgentService {

    private static final Logger log = LoggerFactory.getLogger(SarvamAgentService.class);

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final McpClientService mcpClientService;
    private final ValidationEngine validationEngine;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public SarvamAgentService(
            @Value("${app.ai.sarvam.api-key:}") String apiKey,
            @Value("${app.ai.sarvam.base-url:https://api.sarvam.ai/v1}") String baseUrl,
            @Value("${app.ai.sarvam.model:sarvam-105b}") String model,
            McpClientService mcpClientService,
            ValidationEngine validationEngine,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.model = model;
        this.mcpClientService = mcpClientService;
        this.validationEngine = validationEngine;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().baseUrl(this.baseUrl).build();

        if (isConfigured()) {
            log.info("SarvamAgentService initialized with model='{}', baseUrl='{}'", this.model, this.baseUrl);
        } else {
            log.warn("SarvamAgentService initialized without API key. Please configure SARVAM_API_KEY.");
        }
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && !"not-set".equalsIgnoreCase(apiKey);
    }

    public ChatResponse process(String userMessage, List<Map<String, String>> history) {
        if (!isConfigured()) {
            String note = "Sarvam AI API key is not configured. Please set SARVAM_API_KEY in your .env file or set AI_PROVIDER=groq.";
            log.warn("[SARVAM AGENT] {}", note);
            return ChatResponse.of(
                    note,
                    EvidenceBuilder.builder()
                            .question(userMessage)
                            .source("Sarvam LLM Configuration")
                            .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                            .validationNotes(List.of("SARVAM_API_KEY missing or empty"))
                            .build(),
                    "sarvam");
        }

        log.info("[SARVAM AGENT] Dispatching query to Sarvam model '{}'", model);

        try {
            List<McpToolDefinition> tools = mcpClientService.listTools();
            List<Map<String, Object>> openAiTools = formatOpenAiTools(tools);

            List<Map<String, Object>> conversationMessages = new ArrayList<>();
            conversationMessages.add(Map.of("role", "system", "content",
                    "You are the TBX FinOps Assistant (Tiby). You analyze bank accounts, balances, credit/debit transactions, entities, and payment reference numbers. When asked about financial data, bank balances, or transaction details, you MUST call the appropriate tool to retrieve verified data from PostgreSQL via Google MCP Toolbox. Never invent or hallucinate financial numbers or balances. SECURITY RULE: Never output full unmasked bank account numbers in responses, questions, or examples. Always use masked account numbers (e.g. XXXXXX9069) or the last 4 digits (e.g. 9069), and protect sensitive UTR numbers. When asking the user to specify an account or giving examples, only ask for the last 4 digits (e.g. '9069') or masked account; NEVER suggest, exemplify, or print 14-digit unmasked account numbers. Summarize results concisely, accurately, and professionally. Use the conversation history to resolve follow-up questions and references like 'that account' or 'the previous transaction'. All monetary values are in Indian Rupees (₹); never use $, £, or €. For any month-scoped question or query asking for transactions in a specific month (e.g. 'All Transactions in June 2026', 'transactions in June', 'show transactions in June', 'debits and credits in May', 'how many transactions in May'), you MUST call get_monthly_transaction_summary with the month in YYYY-MM format; the dataset reference year is 2026, so an unqualified month like 'May' means '2026-05' unless the user states another year. get_transaction_volume_summary is NOT date-filtered (it returns all-time totals) and must never be used for a specific month or period. Format responses cleanly using Markdown, including bold text, bulleted lists, or Markdown tables when presenting financial records, followed by a concise 'Summary:' sentence stating total counts and total amounts."));

            if (history == null || history.isEmpty()) {
                conversationMessages.add(Map.of("role", "user", "content", userMessage));
            } else {
                for (Map<String, String> msg : history) {
                    conversationMessages.add(Map.of("role", msg.get("role"), "content", msg.get("content")));
                }
                Map<String, String> lastMsg = history.get(history.size() - 1);
                if (!userMessage.equals(lastMsg.get("content"))) {
                    conversationMessages.add(Map.of("role", "user", "content", userMessage));
                }
            }

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("model", model);
            requestPayload.put("temperature", 0.0);
            requestPayload.put("messages", conversationMessages);

            if (!openAiTools.isEmpty()) {
                requestPayload.put("tools", openAiTools);
                requestPayload.put("tool_choice", "auto");
            }

            String responseStr = restClient.post()
                    .uri("/chat/completions")
                    .header("api-subscription-key", apiKey)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseStr == null) {
                return fallbackError(userMessage, "Received empty response from Sarvam API");
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode choiceNode = root.path("choices").path(0);
            JsonNode messageNode = choiceNode.path("message");
            int tokensUsed = root.path("usage").path("total_tokens").asInt(0);

            JsonNode toolCallsNode = messageNode.path("tool_calls");
            if (toolCallsNode.isArray() && !toolCallsNode.isEmpty()) {
                JsonNode toolCall = toolCallsNode.get(0);
                String toolName = toolCall.path("function").path("name").asText();
                String argsStr = toolCall.path("function").path("arguments").asText("{}");

                @SuppressWarnings("unchecked")
                Map<String, Object> args = objectMapper.readValue(argsStr, Map.class);
                log.info("[SARVAM AGENT] Model invoked tool '{}' with arguments: {}", toolName, args);

                McpToolExecutionResult execResult = mcpClientService.executeTool(toolName, args);

                ValidationResult validation = validationEngine.validate(toolName, execResult.data(), args);

                EvidenceObject evidence = EvidenceBuilder.builder()
                        .question(userMessage)
                        .source("PostgreSQL via Google MCP Toolbox & Sarvam")
                        .tool(toolName)
                        .filters(args)
                        .calculation("Tool: " + toolName + " | Arguments: " + args)
                        .sqlQuery(ToolSqlRegistry.resolve(toolName))
                        .executionTimeMs(execResult.executionTimeMs())
                        .result(execResult.data())
                        .recordCount(execResult.getRecordCount())
                        .validation(validation)
                        .build();

                String finalAnswer = VerifiedAnswerFormatter.format(toolName, execResult.data(), validation);
                return ChatResponse.of(finalAnswer, evidence, "sarvam", tokensUsed);
            }

            // If no tool was called, return direct message content
            String directContent = messageNode.path("content").asText();
            EvidenceObject directEvidence = EvidenceBuilder.builder()
                    .question(userMessage)
                    .source("Sarvam LLM Direct Generation")
                    .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                    .validationNotes(List.of("Model answered directly without invoking MCP tools"))
                    .build();

            return ChatResponse.of(directContent, directEvidence, "sarvam", tokensUsed);

        } catch (Exception e) {
            log.error("[SARVAM AGENT] Request failed: {}", e.getMessage());
            return fallbackError(userMessage, "Sarvam API communication error: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> formatOpenAiTools(List<McpToolDefinition> tools) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (McpToolDefinition tool : tools) {
            Map<String, Object> func = new HashMap<>();
            func.put("name", tool.name());
            func.put("description", tool.description());
            if (tool.inputSchema() != null) {
                func.put("parameters", tool.inputSchema());
            }
            result.add(Map.of("type", "function", "function", func));
        }
        return result;
    }

    private ChatResponse fallbackError(String question, String errorMsg) {
        EvidenceObject errEvidence = EvidenceBuilder.builder()
                .question(question)
                .source("Sarvam API")
                .validationStatus(com.tbx.finops.validation.ValidationStatus.FAILED)
                .validationNotes(List.of(errorMsg))
                .build();
        return ChatResponse.of("Error executing request through Sarvam LLM: " + errorMsg, errEvidence, "sarvam");
    }
}
