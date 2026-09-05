package com.tbx.finops.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 2000, message = "Message exceeds maximum allowed length of 2000 characters")
    String message,

    @Size(max = 64, message = "Session ID exceeds maximum allowed length of 64 characters")
    @JsonAlias({"conversationId", "conversation_id"})
    String sessionId
) {}