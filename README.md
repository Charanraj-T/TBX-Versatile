# TBX Finance Assistant — Enterprise Finance Ops Copilot

A production-grade conversational finance assistant built for the **TBX BVP Tech Catalyst Hackathon**. Features a dual-view workspace (Chat Copilot + Manual Audit Dashboard), deterministic compute-then-synthesize architecture, and full OpenTelemetry observability.

**Model**: `liquid/lfm-2.5-2.6b:free` (2.6B params via OpenRouter) — Zero math in the LLM 
**Database**: PostgreSQL 16 with `pg_trgm` + composite B-tree indexes for 20M-record efficiency 
**Observability**: Micrometer Tracing → OpenTelemetry → Langfuse

---

## Architecture

```text
┌───────────────────────────────────────────────────────────────────────┐
│              Next.js 15 / React 19 Frontend (Port 3000)             │
│                                                                     │
│  View A: 💬 Conversational Copilot    View B: 📊 Manual Dashboard  │
│  • Inline Citations [Ref: xxx]        • Filter Bar (Bank/Date/Type) │
│  • Confidence Badges (🟢🟡🔴)          • Reconciliation Table       │
│  • Anomaly Alerts                     • 1-Click CSV Export          │
│  • Explainability Drawer              • Pagination                  │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ REST API
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   Spring Boot 3.4 API (Port 8080)                   │
│                                                                     │
│  ChatController → FinopsAgentService → ConfidenceEngine             │
│  ConversationHistoryService (follow-up memory within a session)    │
│  OpenRouterAgentService → VerifiedAnswerFormatter (answer synthesis) │
│  FinopsDataController → JdbcTemplate (transactions export)         │
│                                                                     │
│  Micrometer Tracing ──→ OpenTelemetry ──→ Langfuse (OTLP Export)    │
└──────────┬───────────────────────────────────────┬───────────────────┘
           │ REST / JSON-RPC                       │ JDBC
           ▼                                       ▼
┌──────────────────────────┐         ┌──────────────────────────────┐
│   Google MCP Toolbox     │         │      PostgreSQL 16           │
│   (Port 5000)            │         │      (Port 5432)             │
│   12 Parameterized SQL   │────────→│  pg_trgm + B-tree Indexes   │
│   Tools via tools.yaml   │         │  bank / account / transaction│
└──────────────────────────┘         └──────────────────────────────┘
           ↑
           │ Tool Definitions + Calls
┌──────────────────────────┐
│   OpenRouter LLM API     │
│   liquid/lfm-2.5-2.6b    │
│   (Intent + Parameters)  │
└──────────────────────────┘
```

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- OpenRouter API Key (free at [openrouter.ai](https://openrouter.ai))

### 1. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your_key_here
OPENROUTER_MODEL=liquid/lfm-2.5-2.6b:free
```

### 2. Launch with Docker Compose
```bash
docker compose up --build -d
```

### 3. Access Services
| Service | URL |
|---------|-----|
| **Frontend UI** | http://localhost:3000 |
| **Backend API** | http://localhost:8080 |
| **Health Check** | http://localhost:8080/api/health |
| **MCP Toolbox** | http://localhost:5000 |
| **PostgreSQL** | localhost:5432 (finops/finops) |

### Local Development (Without Docker)
```bash
# Terminal 1: Database
docker compose up postgres mcp-toolbox -d

# Terminal 2: Backend
cd backend
mvn spring-boot:run

# Terminal 3: Frontend
cd frontend
npm install && npm run dev
```

---

## 7 Benchmark Q&As

### 1. Vendor Spend Analysis
```
Q: What is the total spend on SELECTION ELECTRONICS in June 2026?
A: Total debit payouts to SELECTION ELECTRONICS in June 2026 reached ₹1,69,299.00
   across 4 transactions. All processed via HDFC Bank.
   🟢 HIGH CONFIDENCE (95-98%) — 100% Grounded, Exact Entity & Explicit Period
```

### 2. Balance Reconciliation
```
Q: Show unreconciled accounts in HDFC Bank
A: Found 3 unreconciled HDFC accounts with significant discrepancies between
   available balance and calculated ledger balance. Largest discrepancy:
   Account XXXXXX9069 — ₹25,907,487.00 gap.
   🟢 HIGH CONFIDENCE — Direct reconciliation query
```

### 3. Period Comparison
```
Q: Compare SELECTION MOBILE spend between May and June 2026
A: Period 1 (May 2026): ₹0.00 | Period 2 (June 2026): ₹1,46,474.00
   Delta: +₹1,46,474.00 (new vendor activity in June)
   🟡 MEDIUM CONFIDENCE — No historical baseline for May
```

### 4. Anomaly Detection
```
Q: Detect anomalous transactions for SELECTION in 2026
A: ⚠️ Anomaly Detected: Transaction 0266384b (₹66,899.00) is 280% higher
   than the historical average of ₹17,588.40.
   🟢 HIGH CONFIDENCE — Statistical Z-score analysis
```

### 5. Transaction Lookup
```
Q: Find details for transaction reference 1715499972
A: Debit of ₹14,866.00 for SELECTION ELECTRONICS DAHISAR EAST via HDFC Bank.
   Account: XXXXXX9069. UTR: ENC:jhI5nAdy...[PROTECTED]
   🟢 HIGH CONFIDENCE — Exact reference match
```

### 6. Bank Summary
```
Q: How many accounts in HDFC Bank and what is total balance?
A: 3 accounts in HDFC BANK LIMITED. Total balance: -₹252,302,939.33
   🟢 HIGH CONFIDENCE — Direct aggregation
```

### 7. Transaction Volume
```
Q: Overall transaction volume summary
A: 10 transactions total. Credits: 2 (₹2,96,810.00). Debits: 8 (₹2,49,806.00).
   Net flow: +₹47,004.00
   🟢 HIGH CONFIDENCE — Complete dataset scan
```

---

## Security Features

- **No Dynamic SQL**: every tool is a fixed parameterized query in `tools.yaml`; the LLM can only supply parameter values, never SQL text
- **Read-Only Tool Surface**: the toolbox exposes only SELECT-style insights (balances, transactions, summaries) — no transfer/wire/delete operations exist
- **PII Masking**: Account numbers → XXXXXX + last 4 digits, UTR numbers → encrypted prefix only
- **Parameterized Queries Only**: all queries via MCP Toolbox parameterized tools

---

## Observability (OpenTelemetry → Langfuse) — Optional

Every query generates an end-to-end trace span:
1. Prompt received → Tool planned by LLM → SQL executed via MCP → Response synthesized
2. Traces export to Langfuse via OTLP endpoint
3. Each response includes `traceId` and `langfuseUrl` for direct trace inspection

Langfuse is an **optional** profile. The backend runs normally with or without credentials — when keys are absent, tracing simply stays off and no external calls are made.

**Docker Compose** — auto-enabled: the `langfuse` profile activates automatically whenever `LANGFUSE_PUBLIC_KEY` is set in `.env`:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
# Base64 of "public_key:secret_key": echo -n "pk-lf-xxx:sk-lf-xxx" | base64
LANGFUSE_AUTH_HEADER=<base64>
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

**Local dev (without Docker)** — activate manually:

```bash
SPRING_PROFILES_ACTIVE=langfuse mvn spring-boot:run
```

To disable again, clear the keys (Compose) or drop `SPRING_PROFILES_ACTIVE` (local).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Lucide Icons |
| Backend | Java 21, Spring Boot 3.4, Spring AI, Micrometer |
| LLM | liquid/lfm-2.5-2.6b:free via OpenRouter (2.6B params) |
| Database | PostgreSQL 16 with pg_trgm + composite indexes |
| MCP | Google MCP Toolbox for Databases |
| Observability | OpenTelemetry → Langfuse |
| Conversation Memory | PostgreSQL-backed history (12-message window) |
| Containers | Docker Compose (4 services) |
