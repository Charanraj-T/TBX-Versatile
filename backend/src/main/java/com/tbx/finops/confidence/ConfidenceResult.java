package com.tbx.finops.confidence;

/**
 * Immutable container for a confidence assessment of an AI-generated answer.
 */
public record ConfidenceResult(
        int score,
        String grade,
        String badgeText,
        String disclaimer
) {

    public static ConfidenceResult of(int score, String grade, String badgeText, String disclaimer) {
        return new ConfidenceResult(score, grade, badgeText, disclaimer);
    }
}