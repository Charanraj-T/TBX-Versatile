package com.tbx.finops.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tbx.finops.evidence.EvidenceObject;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatResponse(
    String answer,
    EvidenceObject evidence,
    String provider,
    Integer tokensUsed
) {
    public static ChatResponse of(String answer, EvidenceObject evidence, String provider) {
        return new ChatResponse(answer, evidence, provider, null);
    }
    
    public static ChatResponse of(String answer, EvidenceObject evidence, String provider, Integer tokensUsed) {
        return new ChatResponse(answer, evidence, provider, tokensUsed);
    }
}

