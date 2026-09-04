package com.tbx.finops.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record HealthResponse(
    String backend,
    String mcp,
    String database,
    String llm,
    String aiProvider,
    String version,
    Map<String, Object> details
) {
    public static HealthResponse of(
        String backend,
        String mcp,
        String database,
        String llm,
        String aiProvider,
        Map<String, Object> details
    ) {
        return new HealthResponse(backend, mcp, database, llm, aiProvider, "0.1.0-starter", details);
    }
}

