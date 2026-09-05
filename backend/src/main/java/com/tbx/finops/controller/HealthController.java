package com.tbx.finops.controller;

import com.tbx.finops.agent.FinopsAgentService;
import com.tbx.finops.mcp.McpClientService;
import com.tbx.finops.model.HealthResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final McpClientService mcpClientService;
    private final FinopsAgentService finopsAgentService;
    private final DataSource dataSource;

    public HealthController(
        McpClientService mcpClientService,
        FinopsAgentService finopsAgentService,
        @Autowired(required = false) DataSource dataSource
    ) {
        this.mcpClientService = mcpClientService;
        this.finopsAgentService = finopsAgentService;
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        String backendStatus = "UP";

        boolean mcpOk = mcpClientService.isHealthy();
        String mcpStatus = mcpOk ? "UP" : "DOWN";

        String dbStatus = checkDatabaseHealth();

        boolean llmConfigured = finopsAgentService.isLlmConfigured();
        String llmStatus = llmConfigured ? "CONFIGURED" : "NOT_CONFIGURED";

        Map<String, Object> details = new HashMap<>();
        details.put("mcpToolboxUrl", mcpClientService.getToolboxUrl());
        details.put("aiProvider", finopsAgentService.getActiveProvider());

        HealthResponse health = HealthResponse.of(
            backendStatus,
            mcpStatus,
            dbStatus,
            llmStatus,
            finopsAgentService.getActiveProvider(),
            details
        );

        return ResponseEntity.ok(health);
    }

    private String checkDatabaseHealth() {
        if (dataSource == null) {
            return "UNKNOWN";
        }
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(2) ? "UP" : "DOWN";
        } catch (Exception e) {
            log.debug("Database health check error: {}", e.getMessage());
            return "DOWN";
        }
    }
}

