package com.tbx.finops.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Structured, evidence-backed response envelope returned by {@code POST /api/v1/chat}.
 * Field names are kept in sync with {@code frontend/lib/types.ts}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FinancialResponse(
        String conversationId,
        String traceId,
        String langfuseUrl,
        Answer answer,
        ConfidenceInfo confidence,
        AnomalyInfo anomaly,
        EvidenceDetail evidence,
        List<Map<String, Object>> records
) {

    public record Answer(
            String headline,
            String breakdownSummary
    ) {}

    public record ConfidenceInfo(
            int score,
            String grade,
            String badgeText,
            String disclaimer
    ) {}

    public record AnomalyInfo(
            boolean detected,
            String alertMessage
    ) {}

    public record Citation(
            String sourceId,
            String date,
            String amount,
            String ref
    ) {}

    public record ModelEfficiency(
            String model,
            long latencyMs,
            int tokensUsed,
            double costEstimateUsd
    ) {}

    public record EvidenceDetail(
            boolean isVerified,
            String toolExecuted,
            @JsonInclude(JsonInclude.Include.NON_NULL) String sqlQuery,
            @JsonInclude(JsonInclude.Include.NON_NULL) Map<String, Object> filters,
            long executionTimeMs,
            int recordsCount,
            List<Citation> citations,
            ModelEfficiency modelEfficiency
    ) {}
}