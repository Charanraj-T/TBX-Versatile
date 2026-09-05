# Google MCP Toolbox Configuration

This directory contains the configuration for the [Google MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox).

---

## Architecture Flow

The MCP Toolbox acts as an isolated Model Context Protocol server exposing database operations as parameterized, secure tools.

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

1. **`get_vendor_spend`**
   - **Parameters**: `vendor_name` (string)
   - **Returns**: `vendor_name`, `total_spend`, `transaction_count`, `vendor_category`.
2. **`get_transaction_summary`**
   - **Parameters**: none
   - **Returns**: `total_transactions`, `total_amount`, `total_vendors`.
3. **`compare_vendor_periods`**
   - **Parameters**: `vendor_name` (string), `period1` (YYYY-MM), `period2` (YYYY-MM)
   - **Returns**: `vendor_name`, `period1_spend`, `period2_spend`, `difference`.
4. **`get_vendor_payment_history`**
   - **Parameters**: `vendor_name` (string)
   - **Returns**: `vendor_name`, `paid_amount`, `payment_method`, `payment_date`, `reference_code`.

---

## Replacing Demo Schema with the Real TBX Dataset

When the actual TBX dataset is ready:

1. Replace `database/init.sql` and `database/seed.sql` with the real TBX schema and tables.
2. Update `mcp-toolbox/tools.yaml` with the new production SQL queries and parameters matching your FinOps requirements.
3. Restart Docker Compose (`docker compose up --build -d`).
4. The Spring Boot backend dynamically discovers the new tools through MCP metadata and immediately exposes them to the active LLM (Groq, OpenRouter, or Sarvam) without changing application code.
