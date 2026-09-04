package com.tbx.finops.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 2000, message = "Message exceeds maximum allowed length of 2000 characters")
    String message
) {}

