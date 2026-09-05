package com.tbx.finops.confidence;

import com.tbx.finops.evidence.EvidenceObject;
import com.tbx.finops.model.ChatResponse;
import com.tbx.finops.validation.ValidationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Scores how trustworthy an answer is before it is shown to the user.
 *
 * <p>Rules of thumb:
 * <ul>
 *   <li>VERIFIED + a real MCP tool + non-empty records  → 95–98 (HIGH) "100% grounded"</li>
 *   <li>WARNING (tool used but data incomplete/absent) → 55–70 (MEDIUM)</li>
 *   <li>FAILED or no evidence                          → 25–40 (LOW)</li>
 * </ul>
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

        int score;
        String disclaimer;

        switch (evidence.validationStatus()) {
            case VERIFIED -> {
                score = 95;
                if (hasTool(evidence)) {
                    score += 2;
                }
                if (evidence.recordCount() != null && evidence.recordCount() > 0) {
                    score += 1;
                }
                score = Math.min(score, 98);
                disclaimer = "100% grounded in verified database records via MCP Toolbox.";
            }
            case WARNING -> {
                score = hasTool(evidence) ? 70 : 55;
                disclaimer = "Partially grounded — verify the figures before taking action.";
            }
            case FAILED -> {
                score = 25;
                disclaimer = "Evidence validation failed — treat the answer as unreliable.";
            }
            default -> {
                score = 50;
                disclaimer = "Groundedness could not be confirmed.";
            }
        }

        String grade = toGrade(score);
        ConfidenceResult result = ConfidenceResult.of(score, grade, grade + " CONFIDENCE", disclaimer);
        log.debug("Confidence evaluated: score={}, grade={} for provider={}, tool={}",
                result.score(), result.grade(), response.provider(),
                evidence.tool() != null ? evidence.tool() : "none");
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