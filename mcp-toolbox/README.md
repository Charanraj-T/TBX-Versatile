# Google MCP Toolbox Configuration

This directory contains the configuration for the [Google MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) configured for the **Tiby / TransBnk Finance Assistant**.

---

## Architecture Flow

The MCP Toolbox acts as an isolated Model Context Protocol server exposing PostgreSQL operations as parameterized, secure tools.

```text
User Question
    │
    ▼
Spring Boot API Backend
    │
    ▼ (Chat Completions + Tool Definitions)
Groq / OpenRouter / Sarvam LLM API
    │
    ▼ (Tool Call: name + parameters)
Spring Boot McpClientService
    │
    ▼ (Streamable HTTP JSON-RPC over /mcp)
Google MCP Toolbox (Port 5000)
    │
    ▼ (Parameterized SQL query)
PostgreSQL Database (Port 5432)
```

- **Docker Image**: `us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest`
- **Default Port**: `5000`
- **Endpoints**:
  - `POST /mcp`: Streamable HTTP MCP JSON-RPC protocol (`tools/list`, `tools/call`)
  - `GET /mcp/sse`: Server-Sent Events MCP endpoint
  - `GET /healthz`: Health check endpoint

---

## Defined Tools in `tools.yaml`

1. **`get_account_balance`**
   - **Parameters**: `identifier` (account UUID or account number or last 4 digits)
   - **Returns**: `account_id`, `entity_id`, `account_number_masked`, `program_id`, `available_balance`, `bank_code`, `bank_name`.

2. **`get_accounts_by_entity`**
   - **Parameters**: `entity_id` (UUID of the customer/entity)
   - **Returns**: list of accounts with bank name, masked account number, program ID, and available balance.

3. **`get_bank_summary`**
   - **Parameters**: `bank_identifier` (bank code like HDFC, ICIC, SBIN, or bank name)
   - **Returns**: `bank_code`, `bank_name`, `total_accounts`, `total_available_balance`.

4. **`get_transaction_by_reference`**
   - **Parameters**: `reference_id` (transaction reference receipt ID, UTR number, or transaction UUID)
   - **Returns**: `transaction_id`, `account_id`, `account_number_masked`, `bank_name`, `transaction_date`, `transaction_type`, `transaction_amount`, `description`, `transaction_reference_id`, `utr_number_masked`.

5. **`get_account_transactions`**
   - **Parameters**: `identifier` (account UUID or account number)
   - **Returns**: Chronological list of transactions (credit and debit) for the specified account.

6. **`get_transaction_volume_summary`**
   - **Parameters**: none
   - **Returns**: `total_transactions`, `total_credits_count`, `total_credits_amount`, `total_debits_count`, `total_debits_amount`, `net_flow`.

7. **`list_banks`**
   - **Parameters**: none
   - **Returns**: Full directory of registered banks with their bank codes, official names, and count of linked accounts.

---

## Security & Sensitive Data Masking

- **Account Numbers**: Transformed in SQL via `CONCAT('XXXXXX', RIGHT(account_number, 4))` so raw bank account numbers never touch LLM prompts or UI chat logs.
- **UTR Numbers**: Protected via `CONCAT('ENC:', LEFT(utr_number, 8), '...[PROTECTED]')` ensuring encrypted transaction tracking identifiers remain secure.
