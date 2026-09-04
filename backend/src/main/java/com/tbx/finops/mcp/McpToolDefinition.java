package com.tbx.finops.mcp;

import java.util.Map;

public record McpToolDefinition(
    String name,
    String description,
    Map<String, Object> inputSchema
) {}

