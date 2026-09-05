package com.tbx.finops.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FinopsDataController {

    private static final Logger log = LoggerFactory.getLogger(FinopsDataController.class);

    private final JdbcTemplate jdbc;

    public FinopsDataController(JdbcTemplate jdbcTemplate) {
        this.jdbc = jdbcTemplate;
    }

    @GetMapping("/data/{table}")
    public ResponseEntity<List<Map<String, Object>>> data(@PathVariable String table) {
        if (!"transactions".equalsIgnoreCase(table)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Unknown data table: " + table);
        }
        List<Map<String, Object>> rows = transactions();
        log.debug("Export table '{}' returned {} rows", table, rows.size());
        return ResponseEntity.ok(rows);
    }

    private List<Map<String, Object>> transactions() {
        return jdbc.queryForList(
            "SELECT t.transaction_date AS txn_date, " +
            "       COALESCE(NULLIF(t.description, ''), 'Fund transfer') AS description, " +
            "       b.bank_name AS vendor_name, " +
            "       'XXXXXX' || RIGHT(a.account_number, 4) AS account_name, " +
            "       t.transaction_amount AS amount, " +
            "       t.transaction_type AS type, " +
            "       CASE WHEN t.transaction_reference_id IS NOT NULL AND t.transaction_reference_id <> '' " +
            "            THEN 'reconciled' ELSE 'unreconciled' END AS is_reconciled, " +
            "       'completed' AS status " +
            "FROM transaction t " +
            "JOIN account a ON a.account_id = t.account_id " +
            "JOIN bank b ON b.bank_code = a.bank_code " +
            "ORDER BY t.transaction_date DESC");
    }
}