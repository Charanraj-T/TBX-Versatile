package com.tbx.finops.mcp;

import java.util.List;
import java.util.Map;

public record McpToolExecutionResult(
    String toolName,
    boolean isError,
    Object data,
    String rawText,
    String errorMessage
) {
    public static McpToolExecutionResult success(String toolName, Object data, String rawText) {
        return new McpToolExecutionResult(toolName, false, data, rawText, null);
    }

    public static McpToolExecutionResult error(String toolName, String errorMessage) {
        return new McpToolExecutionResult(toolName, true, null, null, errorMessage);
    }

    public int getRecordCount() {
        if (data instanceof List<?> list) {
            return list.size();
        } else if (data instanceof Map<?, ?>) {
            return 1;
        }
        return data != null ? 1 : 0;
    }
}

