package com.tbx.finops.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    String error,
    String message,
    int status,
    List<String> details,
    Instant timestamp
) {
    public static ErrorResponse of(String error, String message, int status, List<String> details) {
        return new ErrorResponse(error, message, status, details, Instant.now());
    }

    public static ErrorResponse of(String error, String message, int status) {
        return new ErrorResponse(error, message, status, null, Instant.now());
    }
}

