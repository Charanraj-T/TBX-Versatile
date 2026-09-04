package com.tbx.finops.evidence;

import com.tbx.finops.validation.ValidationResult;
import com.tbx.finops.validation.ValidationStatus;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class EvidenceBuilder {
    private String question;
    private String source = "PostgreSQL (finops_db)";
    private String tool;
    private Map<String, Object> filters = Collections.emptyMap();
    private String calculation;
    private Object result;
    private Integer recordCount = 0;
    private ValidationStatus validationStatus = ValidationStatus.WARNING;
    private List<String> validationNotes = Collections.emptyList();
    private Instant timestamp = Instant.now();

    public static EvidenceBuilder builder() {
        return new EvidenceBuilder();
    }

    public EvidenceBuilder question(String question) {
        this.question = question;
        return this;
    }

    public EvidenceBuilder source(String source) {
        this.source = source;
        return this;
    }

    public EvidenceBuilder tool(String tool) {
        this.tool = tool;
        return this;
    }

    public EvidenceBuilder filters(Map<String, Object> filters) {
        this.filters = filters != null ? filters : Collections.emptyMap();
        return this;
    }

    public EvidenceBuilder calculation(String calculation) {
        this.calculation = calculation;
        return this;
    }

    public EvidenceBuilder result(Object result) {
        this.result = result;
        return this;
    }

    public EvidenceBuilder recordCount(Integer recordCount) {
        this.recordCount = recordCount;
        return this;
    }

    public EvidenceBuilder validation(ValidationResult validationResult) {
        if (validationResult != null) {
            this.validationStatus = validationResult.status();
            this.validationNotes = validationResult.notes();
        }
        return this;
    }

    public EvidenceBuilder validationStatus(ValidationStatus status) {
        this.validationStatus = status;
        return this;
    }

    public EvidenceBuilder validationNotes(List<String> notes) {
        this.validationNotes = notes != null ? notes : Collections.emptyList();
        return this;
    }

    public EvidenceObject build() {
        return new EvidenceObject(
            question,
            source,
            tool,
            filters,
            calculation,
            result,
            recordCount,
            validationStatus,
            validationNotes,
            timestamp != null ? timestamp : Instant.now()
        );
    }
}

