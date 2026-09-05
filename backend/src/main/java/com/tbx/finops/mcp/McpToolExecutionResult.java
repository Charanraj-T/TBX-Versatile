package com.tbx.finops.mcp;

import java.util.List;
import java.util.Map;

public record McpToolExecutionResult(
        String toolName,
        boolean isError,
        Object data,
        String rawText,
        String errorMessage,
        long executionTimeMs) {
    public static McpToolExecutionResult success(String toolName, Object data, String rawText, long executionTimeMs) {
        return new McpToolExecutionResult(toolName, false, data, rawText, null, executionTimeMs);
    }

    public static McpToolExecutionResult error(String toolName, String errorMessage) {
        return new McpToolExecutionResult(toolName, true, null, null, errorMessage, 0L);
    }

    public int getRecordCount() {
        if (data instanceof List<?> list) {
            if (!list.isEmpty() && list.get(0) instanceof Map<?, ?> map && map.containsKey("detail_rows")) {
                Object details = map.get("detail_rows");
                if (details instanceof List<?> detailList && !detailList.isEmpty()) {
                    return detailList.size();
                }
            }
            return list.size();
        } else if (data instanceof Map<?, ?> map) {
            if (map.containsKey("detail_rows")) {
                Object details = map.get("detail_rows");
                if (details instanceof List<?> detailList && !detailList.isEmpty()) {
                    return detailList.size();
                }
            }
            return 1;
        }
        return data != null ? 1 : 0;
    }
}