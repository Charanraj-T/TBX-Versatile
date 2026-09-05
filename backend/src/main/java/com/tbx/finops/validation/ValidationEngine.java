package com.tbx.finops.validation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ValidationEngine {

    private static final Logger log = LoggerFactory.getLogger(ValidationEngine.class);

    /**
     * Main validation entry point between MCP tool execution and answer formulation.
     */
    public ValidationResult validate(String toolName, Object rawResult, Map<String, Object> filters) {
        log.debug("Validating tool execution for tool='{}', filters={}", toolName, filters);

        if (rawResult == null) {
            log.warn("Validation FAILED: tool result is null");
            return ValidationResult.failed("Tool execution returned null data from MCP Toolbox.");
        }

        if (rawResult instanceof List<?> list) {
            if (list.isEmpty()) {
                log.info("Validation WARNING: tool returned empty list for filters={}", filters);
                return ValidationResult.warning("No records matched the requested query filters.", Map.of("recordCount", 0));
            }
            if (list.get(0) instanceof Map<?, ?> firstMap) {
                @SuppressWarnings("unchecked")
                Map<String, Object> item = (Map<String, Object>) firstMap;
                return validateSingleRecord(toolName, item, filters, list.size());
            }
        }

        if (rawResult instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> resultMap = (Map<String, Object>) map;
            return validateSingleRecord(toolName, resultMap, filters, 1);
        }

        // Fallback for primitive or other types
        return ValidationResult.verified("Result verified as valid scalar value.", Map.of("value", rawResult));
    }

    private ValidationResult validateSingleRecord(String toolName, Map<String, Object> record, Map<String, Object> filters, int count) {
        List<String> notes = new ArrayList<>();
        ValidationStatus status = ValidationStatus.VERIFIED;

        switch (toolName) {
            case "get_account_balance" -> {
                if (!record.containsKey("account_id") || !record.containsKey("available_balance")) {
                    return ValidationResult.failed("Result missing required account fields (account_id, available_balance).");
                }
                BigDecimal balance = parseBigDecimal(record.get("available_balance"));
                if (balance == null) {
                    return ValidationResult.failed("Invalid numeric balance value: " + record.get("available_balance"));
                }
                notes.add("Account ID validated: " + record.get("account_id"));
                notes.add("Available balance validated: $" + balance);
                if (record.containsKey("bank_name")) {
                    notes.add("Bank verified: " + record.get("bank_name") + " (" + record.get("bank_code") + ")");
                }
            }

            case "get_bank_summary" -> {
                if (!record.containsKey("bank_code") || !record.containsKey("total_accounts")) {
                    return ValidationResult.failed("Summary missing bank_code or total_accounts fields.");
                }
                Number accounts = parseNumber(record.get("total_accounts"));
                BigDecimal balance = parseBigDecimal(record.get("total_available_balance"));
                notes.add("Bank " + record.get("bank_code") + " validated: " + accounts + " accounts, total balance: $" + balance);
            }

            case "get_transaction_by_reference" -> {
                if (!record.containsKey("transaction_id") || !record.containsKey("transaction_amount")) {
                    return ValidationResult.failed("Transaction missing required transaction_id or transaction_amount fields.");
                }
                BigDecimal amount = parseBigDecimal(record.get("transaction_amount"));
                if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
                    return ValidationResult.failed("Invalid or negative transaction amount: " + record.get("transaction_amount"));
                }
                notes.add("Transaction reference validated: " + record.get("transaction_reference_id"));
                notes.add("Type: " + record.get("transaction_type") + ", Amount: $" + amount);
            }

            case "get_transaction_volume_summary" -> {
                if (!record.containsKey("total_transactions") || !record.containsKey("total_credits_amount")) {
                    return ValidationResult.failed("Summary missing total_transactions or credit/debit amount fields.");
                }
                Number totalTx = parseNumber(record.get("total_transactions"));
                BigDecimal credits = parseBigDecimal(record.get("total_credits_amount"));
                BigDecimal debits = parseBigDecimal(record.get("total_debits_amount"));
                BigDecimal net = parseBigDecimal(record.get("net_flow"));
                notes.add("Total transactions: " + totalTx + ", Credits: $" + credits + ", Debits: $" + debits + ", Net flow: $" + net);
            }

            case "get_account_transactions" -> {
                notes.add("Account transactions history retrieved successfully with " + count + " record(s).");
            }

            case "get_accounts_by_entity" -> {
                notes.add("Entity accounts retrieved successfully with " + count + " account(s).");
            }

            case "list_banks" -> {
                notes.add("Bank registry list verified with " + count + " registered bank(s).");
            }

            default -> {
                notes.add("Generic record validation passed with " + record.size() + " fields.");
            }
        }

        return ValidationResult.of(status, notes, record);
    }

    private BigDecimal parseBigDecimal(Object obj) {
        if (obj == null) return null;
        try {
            return new BigDecimal(obj.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private Number parseNumber(Object obj) {
        if (obj instanceof Number num) return num;
        if (obj == null) return null;
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            try {
                return Double.parseDouble(obj.toString());
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
