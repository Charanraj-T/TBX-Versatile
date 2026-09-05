package com.tbx.finops.confidence;

import com.tbx.finops.evidence.EvidenceObject;
import com.tbx.finops.model.ChatResponse;
import com.tbx.finops.validation.ValidationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Scores how trustworthy an answer is before it is shown to the user.
 *
 * Scoring methodology:
 * 1. Base Score from Validation Status:
 * - VERIFIED: 85 base
 * - WARNING: 60 base
 * - FAILED: 25 base
 * 2. Tool Query Specificity & Determinism:
 * - Exact identifier lookup (e.g. get_account_balance,
 * get_transaction_by_reference): +8
 * - Math/Aggregate ledger analysis (e.g. get_monthly_transaction_summary,
 * calculate_vendor_spend, compare_periods): +6
 * - Reconciliation & Anomaly detection (e.g. get_unreconciled_accounts,
 * detect_anomalies): +5
 * - Registry & broad query (e.g. list_banks, get_bank_summary,
 * get_transaction_volume_summary): +4
 * 3. Records Grounded:
 * - 0 records (empty result): -15 penalty (caps score in MEDIUM)
 * - Single exact record match: +3
 * - Multi-record dataset (> 1): +2
 * 4. Query Filter Specificity:
 * - Non-empty filters provided: +2
 * 5. Validation Depth:
 * - 2 or more validation notes verified: +1
 *
 * Resulting dynamic ranges:
 * - Exact record matches: 97 - 99% HIGH
 * - Mathematical aggregations: 94 - 96% HIGH
 * - Statistical anomalies: 92 - 94% HIGH
 * - Broad lists: 89 - 92% HIGH
 * - Empty matching records: 70 - 76% MEDIUM
 * - Validation warning: 55 - 68% MEDIUM
 * - Failed or no evidence: 25 - 40% LOW
 */
@Component
public class ConfidenceEngine {

    private static final Logger log = LoggerFactory.getLogger(ConfidenceEngine.class);

    public ConfidenceResult evaluate(ChatResponse response) {
        if (response == null) {
            return ConfidenceResult.of(20, "LOW", "LOW CONFIDENCE",
                    "No response received from the AI provider.");
        }

        EvidenceObject evidence = response.evidence();
        if (evidence == null) {
            return ConfidenceResult.of(40, "LOW", "LOW CONFIDENCE",
                    "Answer was not grounded in any database records.");
        }

        ValidationStatus status = evidence.validationStatus();
        if (status == null) {
            return ConfidenceResult.of(50, "MEDIUM", "MEDIUM CONFIDENCE",
                    "Groundedness could not be confirmed.");
        }

        int score;
        String disclaimer;
        String tool = evidence.tool() != null ? evidence.tool() : "";
        int recordCount = evidence.recordCount() != null ? evidence.recordCount() : 0;
        Map<String, Object> filters = evidence.filters();

        switch (status) {
            case VERIFIED -> {
                int base = 85;

                // Tool specificity bonus
                int toolBonus = switch (tool) {
                    case "get_account_balance", "get_transaction_by_reference" -> 8;
                    case "get_monthly_transaction_summary", "calculate_vendor_spend", "compare_periods" -> 6;
                    case "detect_anomalies", "get_unreconciled_accounts" -> 5;
                    case "list_banks", "get_bank_summary", "get_transaction_volume_summary", "get_account_transactions",
                            "get_accounts_by_entity" ->
                        4;
                    default -> (hasTool(evidence) ? 3 : -20);
                };

                // Record grounding factor
                int recordBonus;
                if (recordCount == 0) {
                    recordBonus = -15; // Penalty for empty result
                } else if (recordCount == 1) {
                    recordBonus = 3; // Exact single record
                } else {
                    recordBonus = 2; // Multi-record verified set
                }

                // Filter specificity
                int filterBonus = (filters != null && !filters.isEmpty()) ? 2 : 0;

                // Validation depth
                int notesBonus = (evidence.validationNotes() != null && evidence.validationNotes().size() >= 2) ? 1 : 0;

                score = Math.min(99, Math.max(50, base + toolBonus + recordBonus + filterBonus + notesBonus));

                if (recordCount == 0) {
                    disclaimer = "Query verified by MCP Toolbox, but 0 matching records were found in the ledger.";
                } else if (score >= 97) {
                    disclaimer = "Deterministic exact-match lookup verified against PostgreSQL ledger records.";
                } else if (score >= 93) {
                    disclaimer = "Aggregated calculations mathematically verified across " + recordCount
                            + " ledger record(s).";
                } else {
                    disclaimer = "Grounded in verified database records via MCP Toolbox.";
                }
            }

            case WARNING -> {
                score = hasTool(evidence) ? (recordCount > 0 ? 68 : 58) : 52;
                disclaimer = "Partially grounded — check validation notes before taking action.";
            }

            case FAILED -> {
                score = 25;
                disclaimer = "Evidence validation failed — figures could not be confirmed in the database.";
            }

            default -> {
                score = 50;
                disclaimer = "Groundedness could not be confirmed.";
            }
        }

        String grade = toGrade(score);
        ConfidenceResult result = ConfidenceResult.of(score, grade, grade + " CONFIDENCE", disclaimer);
        log.debug("Confidence evaluated: score={}, grade={} for provider={}, tool={}, recordCount={}",
                result.score(), result.grade(), response.provider(), tool, recordCount);
        return result;
    }

    private boolean hasTool(EvidenceObject evidence) {
        return evidence.tool() != null && !evidence.tool().isBlank();
    }

    private String toGrade(int score) {
        if (score >= 85) {
            return "HIGH";
        }
        if (score >= 60) {
            return "MEDIUM";
        }
        return "LOW";
    }
}