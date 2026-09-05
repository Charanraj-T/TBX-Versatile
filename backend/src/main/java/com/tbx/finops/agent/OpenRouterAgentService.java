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
public class OpenRouterAgentService {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterAgentService.class);

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final String siteUrl;
    private final String appName;
    private final McpClientService mcpClientService;
    private final ValidationEngine validationEngine;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public OpenRouterAgentService(
            @Value("${app.ai.openrouter.api-key:${OPENROUTER_API_KEY:}}") String apiKey,
            @Value("${app.ai.openrouter.base-url:${OPENROUTER_BASE_URL:https://openrouter.ai/api/v1}}") String baseUrl,
            @Value("${app.ai.openrouter.model:${OPENROUTER_MODEL:liquid/lfm-2.5-2.6b:free}}") String model,
            @Value("${app.ai.openrouter.site-url:${FRONTEND_URL:http://localhost:3000}}") String siteUrl,
            @Value("${app.ai.openrouter.app-name:TBX FinOps Assistant}") String appName,
            McpClientService mcpClientService,
            ValidationEngine validationEngine,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.model = model;
        this.siteUrl = siteUrl;
        this.appName = appName;
        this.mcpClientService = mcpClientService;
        this.validationEngine = validationEngine;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().baseUrl(this.baseUrl).build();

        if (isConfigured()) {
            log.info("OpenRouterAgentService initialized with model='{}', baseUrl='{}'", this.model, this.baseUrl);
        } else {
            log.warn("OpenRouterAgentService initialized without API key. Please configure OPENROUTER_API_KEY.");
        }
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && !"not-set".equalsIgnoreCase(apiKey);
    }

    public ChatResponse process(String userMessage, List<Map<String, String>> history) {
        if (!isConfigured()) {
            String note = "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your .env file.";
            log.warn("[OPENROUTER AGENT] {}", note);
            return ChatResponse.of(
                    note,
                    EvidenceBuilder.builder()
                            .question(userMessage)
                            .source("OpenRouter LLM Configuration")
                            .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                            .validationNotes(List.of("OPENROUTER_API_KEY missing or empty"))
                            .build(),
                    "openrouter");
        }

        log.info("[OPENROUTER AGENT] Dispatching query to OpenRouter model '{}'", model);

        try {
            List<McpToolDefinition> tools = mcpClientService.listTools();
            List<Map<String, Object>> openAiTools = formatOpenAiTools(tools);

            List<Map<String, Object>> conversationMessages = new ArrayList<>();
            conversationMessages.add(Map.of(
                    "role", "system",
                    "content",
"You are the TBX FinOps Assistant (Tiby). You analyze bank accounts, balances, credit/debit transactions, entities, and payment reference numbers. When asked about financial data, bank balances, or transaction details, you MUST call the appropriate tool to retrieve verified data from PostgreSQL via Google MCP Toolbox. Never invent or hallucinate financial numbers or balances. Always use masked account numbers (e.g. XXXXXX9069) and protect sensitive UTR numbers in your responses. Summarize results concisely, accurately, and professionally. Use the conversation history to resolve follow-up questions and references like 'that account' or 'the previous transaction'. All monetary values are in Indian Rupees (₹); never use $, £, or €. For any month-scoped question (e.g. 'debits and credits in May', 'transactions done in May', 'how many transactions in May'), you MUST call get_monthly_transaction_summary with the month in YYYY-MM format; the dataset reference year is 2026, so an unqualified month like 'May' means '2026-05' unless the user states another year. get_transaction_volume_summary is NOT date-filtered (it returns all-time totals) and must never be used for a specific month or period. Always answer in clean plain text: never use markdown tables, pipe (|) characters, asterisks, dashes-as-list-bullets, or any markdown syntax. Present multiple records as short numbered lines, then end with a concise 'Summary:' sentence stating total counts and total amounts."));

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
                    .header("Authorization", "Bearer " + apiKey)
                    .header("HTTP-Referer", siteUrl)
                    .header("X-Title", appName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseStr == null) {
                return fallbackError(userMessage, "Received empty response from OpenRouter API");
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode choiceNode = root.path("choices").path(0);
            JsonNode messageNode = choiceNode.path("message");
            int tokensUsed = root.path("usage").path("total_tokens").asInt(0);

            JsonNode toolCallsNode = messageNode.path("tool_calls");
            if (toolCallsNode.isArray() && !toolCallsNode.isEmpty()) {
                JsonNode toolCall = toolCallsNode.get(0);
                String toolCallId = toolCall.path("id").asText();
                String toolName = toolCall.path("function").path("name").asText();
                String argsStr = toolCall.path("function").path("arguments").asText("{}");

                @SuppressWarnings("unchecked")
                Map<String, Object> args = objectMapper.readValue(argsStr, Map.class);
                log.info("[OPENROUTER AGENT] Model invoked tool '{}' with arguments: {}", toolName, args);

                McpToolExecutionResult execResult = mcpClientService.executeTool(toolName, args);

                ValidationResult validation = validationEngine.validate(toolName, execResult.data(), args);

                String finalAnswer = synthesizeAnswer(userMessage, conversationMessages, messageNode, toolCallId,
                        toolName, execResult, validation);

                EvidenceObject evidence = EvidenceBuilder.builder()
                        .question(userMessage)
                        .source("PostgreSQL via Google MCP Toolbox & OpenRouter (" + model + ")")
                        .tool(toolName)
                        .filters(args)
                        .calculation("Tool: " + toolName + " | Arguments: " + args)
                        .sqlQuery(ToolSqlRegistry.resolve(toolName))
                        .executionTimeMs(execResult.executionTimeMs())
                        .result(execResult.data())
                        .recordCount(execResult.getRecordCount())
                        .validation(validation)
                        .build();

                return ChatResponse.of(finalAnswer, evidence, "openrouter", tokensUsed);
            }

            // If no tool was called, return direct message content
            String directContent = messageNode.path("content").asText();
            EvidenceObject directEvidence = EvidenceBuilder.builder()
                    .question(userMessage)
                    .source("OpenRouter LLM Direct Generation (" + model + ")")
                    .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                    .validationNotes(List.of("Model answered directly without invoking MCP tools"))
                    .build();

            return ChatResponse.of(directContent, directEvidence, "openrouter", tokensUsed);

        } catch (Exception e) {
            log.error("[OPENROUTER AGENT] Request failed: {}", e.getMessage(), e);
            return fallbackError(userMessage, "OpenRouter API communication error: " + e.getMessage());
        }
    }

    private String synthesizeAnswer(
            String userMessage,
            List<Map<String, Object>> originalMessages,
            JsonNode assistantMessageNode,
            String toolCallId,
            String toolName,
            McpToolExecutionResult execResult,
            ValidationResult validation) {
        try {
            List<Map<String, Object>> secondTurnMessages = new ArrayList<>(originalMessages);

            @SuppressWarnings("unchecked")
            Map<String, Object> assistantMsg = objectMapper.convertValue(assistantMessageNode, Map.class);
            secondTurnMessages.add(assistantMsg);

            String toolResultContent = execResult.rawText();
            if (toolResultContent == null || toolResultContent.isBlank()) {
                toolResultContent = objectMapper.writeValueAsString(execResult.data());
            }

            Map<String, Object> toolMsg = new HashMap<>();
            toolMsg.put("role", "tool");
            toolMsg.put("tool_call_id", toolCallId);
            toolMsg.put("name", toolName);
            toolMsg.put("content", toolResultContent);
            secondTurnMessages.add(toolMsg);

            Map<String, Object> secondPayload = new HashMap<>();
            secondPayload.put("model", model);
            secondPayload.put("messages", secondTurnMessages);

            String secondResponseStr = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("HTTP-Referer", siteUrl)
                    .header("X-Title", appName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(secondPayload)
                    .retrieve()
                    .body(String.class);

            if (secondResponseStr != null) {
                JsonNode root = objectMapper.readTree(secondResponseStr);
                String synthesis = root.path("choices").path(0).path("message").path("content").asText();
                if (synthesis != null && !synthesis.isBlank()) {
                    return synthesis.trim();
                }
            }
        } catch (Exception e) {
            log.warn("[OPENROUTER AGENT] Second-turn synthesis failed, falling back to verified answer formatting: {}",
                    e.getMessage());
        }

        return VerifiedAnswerFormatter.format(toolName, execResult.data(), validation);
    }

    private List<Map<String, Object>> formatOpenAiTools(List<McpToolDefinition> tools) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (McpToolDefinition tool : tools) {
            Map<String, Object> func = new HashMap<>();
            func.put("name", tool.name());
            func.put("description", tool.description());
            if (tool.inputSchema() != null && !tool.inputSchema().isEmpty()) {
                func.put("parameters", tool.inputSchema());
            } else {
                func.put("parameters", Map.of("type", "object", "properties", Collections.emptyMap()));
            }
            result.add(Map.of("type", "function", "function", func));
        }
        return result;
    }

    private ChatResponse fallbackError(String question, String errorMsg) {
        EvidenceObject errEvidence = EvidenceBuilder.builder()
                .question(question)
                .source("OpenRouter API")
                .validationStatus(com.tbx.finops.validation.ValidationStatus.FAILED)
                .validationNotes(List.of(errorMsg))
                .build();
        return ChatResponse.of("Error executing request through OpenRouter LLM: " + errorMsg, errEvidence, "openrouter");
    }
}

