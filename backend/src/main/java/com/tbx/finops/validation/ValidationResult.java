package com.tbx.finops.validation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public record ValidationResult(
    ValidationStatus status,
    List<String> notes,
    Map<String, Object> validatedMetrics
) {
    public ValidationResult {
        notes = notes == null ? Collections.emptyList() : Collections.unmodifiableList(new ArrayList<>(notes));
        validatedMetrics = validatedMetrics == null ? Collections.emptyMap() : Collections.unmodifiableMap(validatedMetrics);
    }

    public static ValidationResult verified(String message, Map<String, Object> metrics) {
        return new ValidationResult(ValidationStatus.VERIFIED, List.of(message), metrics);
    }

    public static ValidationResult warning(String message, Map<String, Object> metrics) {
        return new ValidationResult(ValidationStatus.WARNING, List.of(message), metrics);
    }

    public static ValidationResult failed(String message) {
        return new ValidationResult(ValidationStatus.FAILED, List.of(message), Map.of());
    }

    public static ValidationResult of(ValidationStatus status, List<String> notes, Map<String, Object> metrics) {
        return new ValidationResult(status, notes, metrics);
    }

    public boolean isVerified() {
        return status == ValidationStatus.VERIFIED;
    }
}

