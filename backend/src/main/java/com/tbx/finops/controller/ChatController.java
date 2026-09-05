package com.tbx.finops.controller;

import com.tbx.finops.agent.FinopsAgentService;
import com.tbx.finops.model.ChatRequest;
import com.tbx.finops.model.ChatResponse;
import com.tbx.finops.model.FinancialResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final FinopsAgentService finopsAgentService;

    public ChatController(FinopsAgentService finopsAgentService) {
        this.finopsAgentService = finopsAgentService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = finopsAgentService.processQueryLegacy(request.message());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/chat")
    public ResponseEntity<FinancialResponse> chatV1(@Valid @RequestBody ChatRequest request) {
        FinancialResponse response = finopsAgentService.processQuery(request.message(), request.sessionId());
        return ResponseEntity.ok(response);
    }
}

