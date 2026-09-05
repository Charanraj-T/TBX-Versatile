package com.tbx.finops.controller;

import com.tbx.finops.agent.FinopsAgentService;
import com.tbx.finops.model.ChatRequest;
import com.tbx.finops.model.ChatResponse;
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
        ChatResponse response = finopsAgentService.processQuery(request.message(), request.sessionId());
        return ResponseEntity.ok(response);
    }
}

