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
            case "get_vendor_spend" -> {
                // 1. Check required fields
                if (!record.containsKey("vendor_name") || !record.containsKey("total_spend")) {
                    return ValidationResult.failed("Result missing required financial fields (vendor_name, total_spend).");
                }

                // 2. Validate numeric spend
                BigDecimal spend = parseBigDecimal(record.get("total_spend"));
                if (spend == null || spend.compareTo(BigDecimal.ZERO) < 0) {
                    return ValidationResult.failed("Spend amount is invalid or negative: " + record.get("total_spend"));
                }
                notes.add("Spend amount validated: $" + spend);

                // 3. Validate transaction count
                Number txCount = parseNumber(record.get("transaction_count"));
                if (txCount == null || txCount.longValue() < 0) {
                    notes.add("Transaction count is unverified or negative.");
                    status = ValidationStatus.WARNING;
                } else {
                    notes.add("Transaction count validated: " + txCount);
                }

                // 4. Validate vendor filter match if provided
                if (filters != null && filters.containsKey("vendor_name")) {
                    String requested = String.valueOf(filters.get("vendor_name")).trim();
                    String actual = String.valueOf(record.get("vendor_name")).trim();
                    if (!actual.toLowerCase().contains(requested.toLowerCase())) {
                        notes.add("Vendor mismatch warning: requested '" + requested + "', got '" + actual + "'.");
                        status = ValidationStatus.WARNING;
                    }
                }

                // 5. Internal consistency
                if (txCount != null && txCount.longValue() == 0 && spend.compareTo(BigDecimal.ZERO) > 0) {
                    notes.add("Consistency warning: total spend is positive but transaction count is zero.");
                    status = ValidationStatus.WARNING;
                }
            }

            case "get_transaction_summary" -> {
                if (!record.containsKey("total_transactions") || !record.containsKey("total_amount")) {
                    return ValidationResult.failed("Summary missing total_transactions or total_amount fields.");
                }
                BigDecimal totalAmount = parseBigDecimal(record.get("total_amount"));
                Number totalTx = parseNumber(record.get("total_transactions"));
                if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) < 0) {
                    return ValidationResult.failed("Invalid total amount: " + record.get("total_amount"));
                }
                notes.add("Total transaction count: " + totalTx + ", Total amount: $" + totalAmount);
            }

            case "compare_vendor_periods" -> {
                if (!record.containsKey("period1_spend") || !record.containsKey("period2_spend")) {
                    return ValidationResult.failed("Comparison result missing period spend fields.");
                }
                BigDecimal p1 = parseBigDecimal(record.get("period1_spend"));
                BigDecimal p2 = parseBigDecimal(record.get("period2_spend"));
                BigDecimal diff = parseBigDecimal(record.get("difference"));

                if (p1 != null && p2 != null && diff != null) {
                    BigDecimal calculatedDiff = p2.subtract(p1);
                    if (calculatedDiff.compareTo(diff) != 0) {
                        notes.add("Arithmetic warning: period2 - period1 (" + calculatedDiff + ") differs from reported difference (" + diff + ").");
                        status = ValidationStatus.WARNING;
                    } else {
                        notes.add("Period comparison arithmetic verified: P1=$" + p1 + ", P2=$" + p2 + ", Diff=$" + diff);
                    }
                }
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

