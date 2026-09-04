package com.tbx.finops.evidence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tbx.finops.validation.ValidationStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EvidenceObject(
    String question,
    String source,
    String tool,
    Map<String, Object> filters,
    String calculation,
    Object result,
    Integer recordCount,
    ValidationStatus validationStatus,
    List<String> validationNotes,
    Instant timestamp
) {}

