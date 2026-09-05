package com.tbx.finops.agent;

import com.tbx.finops.validation.ValidationResult;

import java.util.List;
import java.util.Map;

public final class VerifiedAnswerFormatter {

    private VerifiedAnswerFormatter() {
    }

    public static String format(String toolName, Object data, ValidationResult validation) {
        StringBuilder sb = new StringBuilder();
        sb.append("Based on verified financial records retrieved via Google MCP Toolbox (")
          .append(toolName).append("):\n\n");

        if (data instanceof List<?> list) {
            if (list.isEmpty()) {
                sb.append("No matching financial records were found for this query.");
            } else if (list.size() == 1 && list.get(0) instanceof Map<?, ?>) {
                appendMap(sb, toMap(list.get(0)));
            } else {
                sb.append(list.size()).append(" record(s) retrieved:\n");
                for (int i = 0; i < Math.min(list.size(), 5); i++) {
                    Object item = list.get(i);
                    if (item instanceof Map<?, ?>) {
                        sb.append("\n- ").append(mapSummary(toMap(item)));
                    } else {
                        sb.append("\n- ").append(item);
                    }
                }
                if (list.size() > 5) {
                    sb.append("\n- ... and ").append(list.size() - 5).append(" more record(s)");
                }
            }
        } else if (data instanceof Map<?, ?> map) {
            appendMap(sb, toMap(map));
        } else if (data != null) {
            sb.append("Result: ").append(data);
        } else {
            sb.append("No matching financial records were returned for this query.");
        }

        sb.append("\n\nValidation Status: **").append(validation.status()).append("**.");
        return sb.toString();
    }

    private static void appendMap(StringBuilder sb, Map<String, Object> map) {
        StringBuilder body = new StringBuilder();
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (body.length() > 0) body.append("\n");
            body.append("- **").append(e.getKey()).append(":** ").append(e.getValue());
        }
        sb.append(body);
    }

    private static String mapSummary(Map<String, Object> map) {
        StringBuilder body = new StringBuilder();
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (body.length() > 0) body.append(" | ");
            body.append(e.getKey()).append(": ").append(e.getValue());
        }
        return body.toString();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> toMap(Object o) {
        return (Map<String, Object>) o;
    }
}