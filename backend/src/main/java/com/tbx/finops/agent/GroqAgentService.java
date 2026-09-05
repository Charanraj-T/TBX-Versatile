package com.tbx.finops.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tbx.finops.evidence.EvidenceBuilder;
import com.tbx.finops.evidence.EvidenceObject;
import com.tbx.finops.mcp.McpClientService;
import com.tbx.finops.mcp.McpToolDefinition;
import com.tbx.finops.mcp.McpToolExecutionResult;
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
public class GroqAgentService {

    private static final Logger log = LoggerFactory.getLogger(GroqAgentService.class);

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final McpClientService mcpClientService;
    private final ValidationEngine validationEngine;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GroqAgentService(
            @Value("${app.ai.groq.api-key:${GROQ_API_KEY:}}") String apiKey,
            @Value("${app.ai.groq.base-url:${GROQ_BASE_URL:https://api.groq.com/openai/v1}}") String baseUrl,
            @Value("${app.ai.groq.model:${GROQ_MODEL:openai/gpt-oss-20b}}") String model,
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
            log.info("GroqAgentService initialized with model='{}', baseUrl='{}'", this.model, this.baseUrl);
        } else {
            log.warn("GroqAgentService initialized without API key. Please configure GROQ_API_KEY.");
        }
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && !"not-set".equalsIgnoreCase(apiKey);
    }

    public ChatResponse process(String userMessage) {
        if (!isConfigured()) {
            String note = "Groq AI API key is not configured. Please set GROQ_API_KEY in your .env file.";
            log.warn("[GROQ AGENT] {}", note);
            return ChatResponse.of(
                    note,
                    EvidenceBuilder.builder()
                            .question(userMessage)
                            .source("Groq LLM Configuration")
                            .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                            .validationNotes(List.of("GROQ_API_KEY missing or empty"))
                            .build(),
                    "groq");
        }

        log.info("[GROQ AGENT] Dispatching query to Groq model '{}'", model);

        try {
            // 1. Discover available tools from Google MCP Toolbox
            List<McpToolDefinition> tools = mcpClientService.listTools();
            List<Map<String, Object>> openAiTools = formatOpenAiTools(tools);

            // 2. Prepare chat messages list
            List<Map<String, Object>> conversationMessages = new ArrayList<>();
            conversationMessages.add(Map.of(
                    "role", "system",
                    "content",
                    "You are the TBX FinOps Assistant (Tiby). You analyze bank accounts, balances, credit/debit transactions, entities, and payment reference numbers. When asked about financial data, bank balances, or transaction details, you MUST call the appropriate tool to retrieve verified data from PostgreSQL via Google MCP Toolbox. Never invent or hallucinate financial numbers or balances. Always use masked account numbers (e.g. XXXXXX9069) and protect sensitive UTR numbers in your responses. Summarize results concisely, accurately, and professionally."));
            conversationMessages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("model", model);
            requestPayload.put("messages", conversationMessages);

            if (!openAiTools.isEmpty()) {
                requestPayload.put("tools", openAiTools);
                requestPayload.put("tool_choice", "auto");
            }

            // 3. First-turn call to Groq API
            String responseStr = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseStr == null) {
                return fallbackError(userMessage, "Received empty response from Groq API");
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode choiceNode = root.path("choices").path(0);
            JsonNode messageNode = choiceNode.path("message");

            // 4. Check if the model invoked any MCP tool
            JsonNode toolCallsNode = messageNode.path("tool_calls");
            if (toolCallsNode.isArray() && !toolCallsNode.isEmpty()) {
                JsonNode toolCall = toolCallsNode.get(0);
                String toolCallId = toolCall.path("id").asText();
                String toolName = toolCall.path("function").path("name").asText();
                String argsStr = toolCall.path("function").path("arguments").asText("{}");

                @SuppressWarnings("unchecked")
                Map<String, Object> args = objectMapper.readValue(argsStr, Map.class);
                log.info("[GROQ AGENT] Model invoked tool '{}' with arguments: {}", toolName, args);

                // 5. Execute tool via Google MCP Toolbox
                McpToolExecutionResult execResult = mcpClientService.executeTool(toolName, args);

                // 6. Validate result via Validation Engine
                ValidationResult validation = validationEngine.validate(toolName, execResult.data(), args);

                // 7. Synthesize final answer via Groq second-turn call
                String finalAnswer = synthesizeAnswer(userMessage, conversationMessages, messageNode, toolCallId,
                        toolName, execResult, validation);

                // 8. Construct audit EvidenceObject
                EvidenceObject evidence = EvidenceBuilder.builder()
                        .question(userMessage)
                        .source("PostgreSQL via Google MCP Toolbox & Groq (" + model + ")")
                        .tool(toolName)
                        .filters(args)
                        .calculation("Tool: " + toolName + " | Arguments: " + args)
                        .result(execResult.data())
                        .recordCount(execResult.getRecordCount())
                        .validation(validation)
                        .build();

                return ChatResponse.of(finalAnswer, evidence, "groq");
            }

            // If no tool was called, return direct message content
            String directContent = messageNode.path("content").asText();
            EvidenceObject directEvidence = EvidenceBuilder.builder()
                    .question(userMessage)
                    .source("Groq LLM Direct Generation (" + model + ")")
                    .validationStatus(com.tbx.finops.validation.ValidationStatus.WARNING)
                    .validationNotes(List.of("Model answered directly without invoking MCP tools"))
                    .build();

            return ChatResponse.of(directContent, directEvidence, "groq");

        } catch (Exception e) {
            log.error("[GROQ AGENT] Request failed: {}", e.getMessage(), e);
            return fallbackError(userMessage, "Groq API communication error: " + e.getMessage());
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

            // Convert assistant message with tool calls to map
            Map<String, Object> assistantMsg = objectMapper.convertValue(assistantMessageNode, Map.class);
            secondTurnMessages.add(assistantMsg);

            // Add tool response message
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
            log.warn("[GROQ AGENT] Second-turn synthesis failed, falling back to verified answer formatting: {}",
                    e.getMessage());
        }

        return formatVerifiedAnswer(userMessage, toolName, execResult.data(), validation);
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

    private String formatVerifiedAnswer(String question, String toolName, Object data, ValidationResult validation) {
        return "Based on verified financial records retrieved via Google MCP Toolbox (" + toolName + "):\n\n"
                + "Data: " + data + "\n\n"
                + "Validation Status: **" + validation.status() + "**.";
    }

    private ChatResponse fallbackError(String question, String errorMsg) {
        EvidenceObject errEvidence = EvidenceBuilder.builder()
                .question(question)
                .source("Groq API")
                .validationStatus(com.tbx.finops.validation.ValidationStatus.FAILED)
                .validationNotes(List.of(errorMsg))
                .build();
        return ChatResponse.of("Error executing request through Groq LLM: " + errorMsg, errEvidence, "groq");
    }
}
