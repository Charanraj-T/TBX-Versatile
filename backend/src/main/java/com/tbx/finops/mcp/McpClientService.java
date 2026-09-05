package com.tbx.finops.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Service
public class McpClientService {

    private static final Logger log = LoggerFactory.getLogger(McpClientService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String toolboxUrl;

    public McpClientService(
        @Value("${app.mcp.toolbox-url:http://mcp-toolbox:5000}") String toolboxUrl,
        ObjectMapper objectMapper
    ) {
        this.toolboxUrl = toolboxUrl.replaceAll("/+$", "");
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
            .baseUrl(this.toolboxUrl)
            .build();
        log.info("Initialized McpClientService connecting to Google MCP Toolbox at: {}", this.toolboxUrl);
    }

    /**
     * Checks if Google MCP Toolbox is healthy and reachable.
     */
    public boolean isHealthy() {
        try {
            // First check /healthz endpoint provided by toolbox
            var response = restClient.get()
                .uri("/healthz")
                .retrieve()
                .toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            // Fallback check: attempt tools/list via /mcp
            try {
                return !listTools().isEmpty();
            } catch (Exception ex) {
                log.warn("Google MCP Toolbox health check failed: {}", e.getMessage());
                return false;
            }
        }
    }

    /**
     * Discovers all available tools registered in Google MCP Toolbox.
     */
    public List<McpToolDefinition> listTools() {
        try {
            log.debug("Sending tools/list request to MCP Toolbox: {}/mcp", toolboxUrl);
            Map<String, Object> rpcPayload = Map.of(
                "jsonrpc", "2.0",
                "id", UUID.randomUUID().toString(),
                "method", "tools/list",
                "params", Collections.emptyMap()
            );

            String responseBody = restClient.post()
                .uri("/mcp")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(rpcPayload)
                .retrieve()
                .body(String.class);

            if (responseBody == null) {
                log.warn("Received empty response from MCP Toolbox for tools/list");
                return Collections.emptyList();
            }

            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode toolsNode = rootNode.path("result").path("tools");
            if (!toolsNode.isArray()) {
                log.warn("tools/list did not return a tools array: {}", responseBody);
                return Collections.emptyList();
            }

            List<McpToolDefinition> tools = new ArrayList<>();
            for (JsonNode toolNode : toolsNode) {
                String name = toolNode.path("name").asText();
                String description = toolNode.path("description").asText("");
                Map<String, Object> inputSchema = objectMapper.convertValue(toolNode.path("inputSchema"), Map.class);
                tools.add(new McpToolDefinition(name, description, inputSchema));
            }

            log.info("Successfully discovered {} MCP tools from Google MCP Toolbox", tools.size());
            return tools;
        } catch (Exception e) {
            log.error("Failed to list tools from MCP Toolbox at {}: {}", toolboxUrl, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Executes a specific tool on the Google MCP Toolbox using MCP JSON-RPC protocol over Streamable HTTP.
     */
    public McpToolExecutionResult executeTool(String toolName, Map<String, Object> arguments) {
        log.info("Executing MCP tool '{}' with arguments: {}", toolName, arguments);
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("name", toolName);
            params.put("arguments", arguments != null ? arguments : Collections.emptyMap());

            Map<String, Object> rpcPayload = Map.of(
                "jsonrpc", "2.0",
                "id", UUID.randomUUID().toString(),
                "method", "tools/call",
                "params", params
            );

            String responseBody = restClient.post()
                .uri("/mcp")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(rpcPayload)
                .retrieve()
                .body(String.class);

            if (responseBody == null) {
                return McpToolExecutionResult.error(toolName, "Null response received from MCP Toolbox");
            }

            log.debug("MCP Toolbox raw response for '{}': {}", toolName, responseBody);
            JsonNode rootNode = objectMapper.readTree(responseBody);

            if (rootNode.has("error")) {
                String errorMsg = rootNode.path("error").path("message").asText("Unknown MCP JSON-RPC error");
                log.error("MCP Toolbox returned error for '{}': {}", toolName, errorMsg);
                return McpToolExecutionResult.error(toolName, errorMsg);
            }

            JsonNode resultNode = rootNode.path("result");
            boolean isError = resultNode.path("isError").asBoolean(false);
            JsonNode contentNode = resultNode.path("content");

            String rawText = "";
            Object parsedData = null;

            if (contentNode.isArray() && !contentNode.isEmpty()) {
                if (contentNode.size() == 1) {
                    JsonNode firstItem = contentNode.get(0);
                    rawText = firstItem.path("text").asText("");
                    try {
                        parsedData = objectMapper.readValue(rawText, Object.class);
                    } catch (Exception ignored) {
                        parsedData = rawText;
                    }
                } else {
                    List<Object> rows = new ArrayList<>();
                    StringBuilder rawBuilder = new StringBuilder("[");
                    for (int i = 0; i < contentNode.size(); i++) {
                        String itemText = contentNode.get(i).path("text").asText("");
                        if (i > 0) rawBuilder.append(",");
                        rawBuilder.append(itemText);
                        try {
                            rows.add(objectMapper.readValue(itemText, Object.class));
                        } catch (Exception ignored) {
                            rows.add(itemText);
                        }
                    }
                    rawBuilder.append("]");
                    rawText = rawBuilder.toString();
                    parsedData = rows;
                }
            }

            if (isError) {
                return McpToolExecutionResult.error(toolName, rawText.isEmpty() ? "Tool execution error" : rawText);
            }

            return McpToolExecutionResult.success(toolName, parsedData, rawText);
        } catch (Exception e) {
            log.error("Failed to execute MCP tool '{}': {}", toolName, e.getMessage());
            return McpToolExecutionResult.error(toolName, "Communication failure with MCP Toolbox: " + e.getMessage());
        }
    }

    public String getToolboxUrl() {
        return toolboxUrl;
    }
}

