package com.tbx.finops.mcp;

import java.util.Map;

/**
 * Resolves an MCP tool name to its parameterized SQL statement so the Evidence
 * card can show exactly which query produced an answer.
 * Must be kept in sync with {@code mcp-toolbox/tools.yaml}.
 */
public final class ToolSqlRegistry {

    private ToolSqlRegistry() {
    }

    private static final Map<String, String> SQL_BY_TOOL = Map.ofEntries(
            Map.entry("get_account_balance", """
                    SELECT
                      a.account_id,
                      a.entity_id,
                      CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                      a.program_id,
                      a.available_balance,
                      a.bank_code,
                      b.bank_name
                    FROM account a
                    JOIN bank b ON a.bank_code = b.bank_code
                    WHERE a.account_id = $1
                       OR a.account_id LIKE $1 || '%'
                       OR a.account_number = $1
                       OR a.account_number LIKE '%' || $1
                    ORDER BY CASE WHEN a.account_id = $1 OR a.account_number = $1 THEN 0 ELSE 1 END
                    LIMIT 1;"""),

            Map.entry("get_accounts_by_entity", """
                    SELECT
                      a.account_id,
                      a.entity_id,
                      CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                      a.program_id,
                      a.available_balance,
                      a.bank_code,
                      b.bank_name
                    FROM account a
                    JOIN bank b ON a.bank_code = b.bank_code
                    WHERE a.entity_id = $1
                    ORDER BY a.available_balance DESC;"""),

            Map.entry("get_bank_summary", """
                    SELECT
                      b.bank_code,
                      b.bank_name,
                      COUNT(a.account_id) AS total_accounts,
                      COALESCE(SUM(a.available_balance), 0) AS total_available_balance
                    FROM bank b
                    LEFT JOIN account a ON b.bank_code = a.bank_code
                    WHERE b.bank_code ILIKE '%' || $1 || '%' OR b.bank_name ILIKE '%' || $1 || '%'
                    GROUP BY b.bank_code, b.bank_name;"""),

            Map.entry("get_transaction_by_reference", """
                    SELECT
                      t.transaction_id,
                      t.account_id,
                      CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                      a.bank_code,
                      b.bank_name,
                      TO_CHAR(t.transaction_date, 'YYYY-MM-DD HH24:MI:SS') AS transaction_date,
                      t.transaction_type,
                      t.transaction_amount,
                      t.description,
                      t.transaction_reference_id,
                      CASE WHEN t.utr_number IS NOT NULL THEN CONCAT('ENC:', LEFT(t.utr_number, 8), '...[PROTECTED]') ELSE NULL END AS utr_number_masked
                    FROM transaction t
                    JOIN account a ON t.account_id = a.account_id
                    JOIN bank b ON a.bank_code = b.bank_code
                    WHERE t.transaction_reference_id = $1
                       OR t.transaction_reference_id LIKE $1 || '%'
                       OR t.utr_number = $1
                       OR t.utr_number LIKE '%' || $1
                       OR t.transaction_id = $1
                       OR t.transaction_id LIKE $1 || '%'
                    ORDER BY CASE WHEN t.transaction_reference_id = $1 OR t.utr_number = $1 OR t.transaction_id = $1 THEN 0 ELSE 1 END
                    LIMIT 1;"""),

            Map.entry("get_account_transactions", """
                    SELECT
                      t.transaction_id,
                      CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                      a.bank_code,
                      b.bank_name,
                      TO_CHAR(t.transaction_date, 'YYYY-MM-DD HH24:MI:SS') AS transaction_date,
                      t.transaction_type,
                      t.transaction_amount,
                      t.description,
                      t.transaction_reference_id
                    FROM transaction t
                    JOIN account a ON t.account_id = a.account_id
                    JOIN bank b ON a.bank_code = b.bank_code
                    WHERE a.account_id = $1
                       OR a.account_id LIKE $1 || '%'
                       OR a.account_number = $1
                       OR a.account_number LIKE '%' || $1
                    ORDER BY t.transaction_date DESC
                    LIMIT 20;"""),

            Map.entry("get_transaction_volume_summary", """
                    SELECT
                      COUNT(t.transaction_id) AS total_transactions,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN 1 ELSE 0 END), 0) AS total_credits_count,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE 0 END), 0) AS total_credits_amount,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN 1 ELSE 0 END), 0) AS total_debits_count,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.transaction_amount ELSE 0 END), 0) AS total_debits_amount,
                      (COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE 0 END), 0) -
                       COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.transaction_amount ELSE 0 END), 0)) AS net_flow
                    FROM transaction t;"""),

            Map.entry("get_monthly_transaction_summary", """
                    SELECT
                      COUNT(t.transaction_id) AS total_transactions,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN 1 ELSE 0 END), 0) AS total_credits_count,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE 0 END), 0) AS total_credits_amount,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN 1 ELSE 0 END), 0) AS total_debits_count,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.transaction_amount ELSE 0 END), 0) AS total_debits_amount,
                      (COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE 0 END), 0) -
                       COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.transaction_amount ELSE 0 END), 0)) AS net_flow
                    FROM transaction t
                    WHERE TO_CHAR(t.transaction_date, 'YYYY-MM') = $1;"""),

            Map.entry("list_banks", """
                    SELECT
                      b.bank_code,
                      b.bank_name,
                      COUNT(a.account_id) AS registered_accounts
                    FROM bank b
                    LEFT JOIN account a ON b.bank_code = a.bank_code
                    GROUP BY b.bank_code, b.bank_name
                    ORDER BY b.bank_code ASC;"""),

            Map.entry("calculate_vendor_spend", """
                    WITH matched_txns AS (
                      SELECT
                        t.transaction_id,
                        t.account_id,
                        CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                        a.bank_code,
                        b.bank_name,
                        TO_CHAR(t.transaction_date, 'YYYY-MM-DD HH24:MI:SS') AS transaction_date,
                        t.transaction_type,
                        t.transaction_amount,
                        t.description,
                        t.transaction_reference_id,
                        COALESCE(SUM(t.transaction_amount) OVER (), 0) AS total_spend,
                        COUNT(t.transaction_id) OVER () AS transaction_count,
                        ROUND(COALESCE(AVG(t.transaction_amount) OVER (), 0), 2) AS avg_ticket_size,
                        ROW_NUMBER() OVER (ORDER BY t.transaction_date DESC) AS rn
                      FROM transaction t
                      JOIN account a ON t.account_id = a.account_id
                      JOIN bank b ON a.bank_code = b.bank_code
                      WHERE t.transaction_type = 'debit'
                        AND t.description ILIKE '%' || $1 || '%'
                        AND t.transaction_date >= $2::timestamp
                        AND t.transaction_date < ($3::timestamp + INTERVAL '1 day')
                    )
                    SELECT
                      m.total_spend,
                      m.transaction_count,
                      m.avg_ticket_size,
                      (SELECT COALESCE(json_agg(json_build_object(
                        'transaction_id', d.transaction_id,
                        'account_number_masked', d.account_number_masked,
                        'bank_code', d.bank_code,
                        'bank_name', d.bank_name,
                        'transaction_date', d.transaction_date,
                        'transaction_amount', d.transaction_amount,
                        'description', d.description,
                        'transaction_reference_id', d.transaction_reference_id
                      )) FILTER (WHERE d.rn <= 50 AND d.transaction_id IS NOT NULL), '[]'::json)
                      FROM matched_txns d) AS detail_rows
                    FROM matched_txns m
                    WHERE m.rn = 1;"""),

            Map.entry("get_unreconciled_accounts", """
                    SELECT
                      a.account_id,
                      CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                      a.bank_code,
                      b.bank_name,
                      a.available_balance,
                      COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE -t.transaction_amount END), 0) AS calculated_ledger_balance,
                      a.available_balance - COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE -t.transaction_amount END), 0) AS discrepancy
                    FROM account a
                    JOIN bank b ON a.bank_code = b.bank_code
                    LEFT JOIN transaction t ON t.account_id = a.account_id
                    WHERE ($1 = '' OR a.bank_code ILIKE $1)
                    GROUP BY a.account_id, a.account_number, a.bank_code, b.bank_name, a.available_balance
                    HAVING ABS(a.available_balance - COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE -t.transaction_amount END), 0)) > 0.01
                    ORDER BY ABS(a.available_balance - COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.transaction_amount ELSE -t.transaction_amount END), 0)) DESC;"""),

            Map.entry("compare_periods", """
                    SELECT
                      period1_total,
                      period2_total,
                      (period2_total - period1_total) AS absolute_delta,
                      CASE WHEN period1_total > 0 THEN ROUND(((period2_total - period1_total) / period1_total) * 100, 2) ELSE NULL END AS percentage_change
                    FROM (
                      SELECT
                        COALESCE(SUM(CASE WHEN t.transaction_date >= $2::timestamp
                                          AND t.transaction_date < ($3::timestamp + INTERVAL '1 day')
                                     THEN t.transaction_amount END), 0) AS period1_total,
                        COALESCE(SUM(CASE WHEN t.transaction_date >= $4::timestamp
                                          AND t.transaction_date < ($5::timestamp + INTERVAL '1 day')
                                     THEN t.transaction_amount END), 0) AS period2_total
                      FROM transaction t
                      WHERE t.transaction_type = 'debit'
                        AND t.description ILIKE '%' || $1 || '%'
                        AND ( (t.transaction_date >= $2::timestamp AND t.transaction_date < ($3::timestamp + INTERVAL '1 day'))
                           OR (t.transaction_date >= $4::timestamp AND t.transaction_date < ($5::timestamp + INTERVAL '1 day')) )
                    ) totals;"""),

            Map.entry("detect_anomalies", """
                    WITH baseline AS (
                      SELECT
                        AVG(t.transaction_amount) AS hist_avg,
                        COALESCE(STDDEV(t.transaction_amount), 0) AS hist_stddev
                      FROM transaction t
                      WHERE t.transaction_type = 'debit'
                        AND t.description ILIKE '%' || $1 || '%'
                        AND t.transaction_date < $2::timestamp
                    ),
                    window_txns AS (
                      SELECT
                        t.transaction_id,
                        t.account_id,
                        CONCAT('XXXXXX', RIGHT(a.account_number, 4)) AS account_number_masked,
                        a.bank_code,
                        b.bank_name,
                        TO_CHAR(t.transaction_date, 'YYYY-MM-DD HH24:MI:SS') AS transaction_date,
                        t.transaction_amount,
                        t.description,
                        t.transaction_reference_id
                      FROM transaction t
                      JOIN account a ON t.account_id = a.account_id
                      JOIN bank b ON a.bank_code = b.bank_code
                      WHERE t.transaction_type = 'debit'
                        AND t.description ILIKE '%' || $1 || '%'
                        AND t.transaction_date >= $2::timestamp
                        AND t.transaction_date < ($3::timestamp + INTERVAL '1 day')
                    )
                    SELECT
                      w.*,
                      b.hist_avg,
                      b.hist_stddev,
                      ROUND((b.hist_avg + 2.5 * b.hist_stddev), 2) AS anomaly_threshold,
                      CASE WHEN b.hist_avg > 0 THEN ROUND(((w.transaction_amount / b.hist_avg) - 1) * 100, 2) ELSE NULL END AS pct_above_avg,
                      CASE WHEN w.transaction_amount > (b.hist_avg + 2.5 * b.hist_stddev) THEN true ELSE false END AS is_anomaly
                    FROM window_txns w
                    CROSS JOIN baseline b
                    WHERE b.hist_stddev > 0 AND w.transaction_amount > (b.hist_avg + 2.5 * b.hist_stddev)
                    ORDER BY w.transaction_amount DESC;""")
    );

    /**
     * @return the parameterized SQL for the given tool, or {@code null} when unknown.
     */
    public static String resolve(String toolName) {
        return SQL_BY_TOOL.get(toolName);
    }
}