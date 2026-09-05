# TBX FinOps Assistant — Production Starter Repository

A production-structured starter package for the **TBX FinOps Assistant**, built with **Next.js 14**, **Java 21 & Spring Boot 3.4** (Spring AI), **Groq LLM API** (`openai/gpt-oss-20b`), **Google MCP Toolbox for Databases**, and **PostgreSQL**.

---

## 1. Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Frontend (Port 3000)                │
│                                                             │
│  Chat Interface • History • Evidence Drawer • Health Badges │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (/api/chat, /api/health)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Spring Boot API (Port 8080)                  │
│                                                             │
│  Controllers • FinopsAgentService • ValidationEngine        │
│  EvidenceBuilder • Spring AI MCP Client / HTTP Transport    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ REST / JSON-RPC              │ Streamable HTTP / SSE
               ▼                              ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│     Groq LLM API             │  │   Google MCP Toolbox      │
│   (openai/gpt-oss-20b)       │  │   (Port 5000)             │
│   Fast Tool Calling via LPU  │  │   Parameterized SQL Tools │
└──────────────────────────────┘  └─────────────┬─────────────┘
                                                │
                                                │ PostgreSQL (Port 5432)
                                                ▼
                                  ┌───────────────────────────┐
                                  │      PostgreSQL DB        │
                                  │  (Demo Vendors & Spend)   │
                                  └───────────────────────────┘
```

### Key Architectural Tenets

1. **Separation of Concerns**: The LLM never connects directly to PostgreSQL and cannot execute arbitrary raw SQL.
2. **Deterministic Financial Math**: Calculations and aggregations are executed by PostgreSQL queries inside the Google MCP Toolbox and validated by `ValidationEngine` before answer formulation. The LLM never computes financial numbers directly.
3. **Traceable Evidence**: Every assistant response includes an immutable `EvidenceObject` capturing source, tool invoked, query parameters, executed calculation, live result data, record count, and validation status.
4. **Live Tool-Calling**: Connects to the Groq LLM API with dynamic tool definitions synced directly from `mcp-toolbox/tools.yaml`.

---

## 2. Repository Structure

```text
tbx-finops-assistant/
├── frontend/                     # Next.js 14 chat interface & Tailwind UI
│   ├── app/                      # Next.js App Router (layout, page, CSS)
│   ├── components/               # ChatInterface, EvidenceCard, HealthBadge, etc.
│   ├── lib/                      # Typed API client and models
│   ├── package.json
│   └── Dockerfile
│
├── backend/                      # Java 21 + Spring Boot 3.4 microservice
│   ├── src/main/java/com/tbx/finops/
│   │   ├── controller/           # REST endpoints (/api/chat, /api/health)
│   │   ├── agent/                # FinopsAgentService, GroqAgentService, OpenRouterAgentService, SarvamAgentService
│   │   ├── mcp/                  # Google MCP Toolbox Client (Streamable HTTP & SSE)
│   │   ├── validation/           # ValidationEngine, ValidationResult, ValidationStatus
│   │   ├── evidence/             # EvidenceObject, EvidenceBuilder
│   │   ├── model/                # Request / Response DTOs
│   │   └── config/               # CORS, Error handlers, AI configs
│   ├── src/main/resources/       # application.yml
│   ├── pom.xml                   # Maven dependencies (Spring Boot 3.4.2, Java 21)
│   └── Dockerfile
│
├── mcp-toolbox/                  # Google MCP Toolbox Configuration
│   ├── tools.yaml                # Parameterized SQL tools mapping to Postgres
│   └── README.md
│
├── database/                     # PostgreSQL Initialization & Demo Seeds
│   ├── init.sql                  # vendors, transactions, payments schema
│   └── seed.sql                  # Seed records for Vendor A, B, C, D
│
├── docker-compose.yml            # Multi-container local orchestration
├── .env.example                  # Environment configuration template
├── .gitignore
└── README.md
```

---

## 3. Quick Start (Local Setup)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)

### 1. Configure Environment

Copy `.env.example` to `.env` and provide your Groq API key:

```bash
cp .env.example .env
```

Ensure `.env` contains:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
```

### 2. Launch with Docker Compose

```bash
docker compose up --build -d
```

This starts all 4 containers:

- `tbx-postgres`: PostgreSQL database with demo schema & seed records
- `tbx-mcp-toolbox`: Google MCP Toolbox server on port 5000
- `tbx-backend`: Spring Boot backend on port 8080
- `tbx-frontend`: Next.js web application on port 3000

### 3. Access Services

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- **MCP Toolbox**: [http://localhost:5000](http://localhost:5000)
- **PostgreSQL**: `localhost:5432` (`finops` / `finops`)

---

## 4. Testing Financial & Banking Questions

You can test these in the Next.js UI ([http://localhost:3000](http://localhost:3000)) or via `curl`:

### 1. Account Available Balance:
```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the available balance for account acfbe204-7541-492c-a352-040aa984bedc?"}' | jq .
```
_Expected_: Account balance of **-₹25,907,487.00** (HDFC Bank, Masked: `XXXXXX9069`). Tool: `get_account_balance`.

### 2. Transaction Reference Number Lookup:
```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find details for transaction reference 1715499972"}' | jq .
```
_Expected_: Debit of **₹14,866.00** for Selection Electronics Dahisar East with protected UTR. Tool: `get_transaction_by_reference`.

### 3. Bank Account & Balance Summary:
```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many accounts do we have in HDFC Bank and what is our total balance?"}' | jq .
```
_Expected_: **3 accounts** in HDFC Bank Limited with total balance of **-₹252,302,939.33**. Tool: `get_bank_summary`.

### 4. Overall Transaction Volume & Net Flow:
```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the overall transaction volume summary across credits and debits?"}' | jq .
```
_Expected_: 10 transactions (2 Credits totaling ₹296,810.00, 8 Debits totaling ₹249,806.00, Net flow +₹47,004.00). Tool: `get_transaction_volume_summary`.

### 5. Registered Banks Registry:
```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List all registered banks in the system"}' | jq .
```
_Expected_: Full table of 10 registered banks (HDFC, ICIC, SBIN, UTIB, KKBK, CNRB, UBIN, AUBL, TMBL, RATN) with linked accounts count. Tool: `list_banks`.

---

## 5. AI Provider Configuration

The assistant uses live LLM tool-calling:

### A. Groq API (Default / Active)

Groq provides ultra-low latency inference with OpenAI-compatible tool calling.

1. In `.env`:
   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_MODEL=openai/gpt-oss-20b
   ```
2. Restart the backend container:
   ```bash
   docker compose restart backend
   ```
3. When queries arrive:
   - Tool definitions are dynamically retrieved from Google MCP Toolbox (`tools/list`).
   - Groq receives the prompt and tool definitions.
   - Groq invokes the matching tool with structured parameters.
   - The backend runs the tool on Google MCP Toolbox (`tools/call`).
   - Results pass through `ValidationEngine` (checking field presence, non-negative numbers, arithmetic integrity).
   - A second turn call to Groq synthesizes a clean, professional financial explanation.
   - An immutable `EvidenceObject` is attached with `validationStatus: VERIFIED`.

### B. OpenRouter API (Access Any Foundation Model)

OpenRouter provides access to Claude 3.5 Sonnet, Llama 3.3 70B, DeepSeek Chat/R1, GPT-4o, and hundreds of other foundation models with unified OpenAI-compatible tool calling.

1. In `.env`:
   ```env
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
   ```
2. Restart the backend container:
   ```bash
   docker compose restart backend
   ```
3. OpenRouter receives MCP tool schemas from Google MCP Toolbox, invokes tools, passes data through `ValidationEngine`, and returns verified financial evidence.

### C. Sarvam AI (Alternative)

To switch to Sarvam AI, set `AI_PROVIDER=sarvam` and provide `SARVAM_API_KEY`, `SARVAM_BASE_URL`, and `SARVAM_MODEL` in `.env`.

---

## 6. How Spring AI Connects to Google MCP Toolbox

- The **Google MCP Toolbox** (`us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest`) runs on port `5000` within Docker Compose.
- The Spring Boot backend connects via HTTP JSON-RPC and Streamable HTTP to `http://mcp-toolbox:5000/mcp`.
- Tool discovery is performed dynamically via `tools/list`, and tool calls are dispatched via `tools/call`.
- The backend's `McpClientService` provides complete isolation, error handling, and audit logging.

---

## 7. Replacing Demo Data with the Real TBX Dataset

When the official TBX dataset and requirements arrive:

```text
database/
   ↓
1. Replace init.sql & seed.sql with TBX schema & production data
   ↓
2. Update mcp-toolbox/tools.yaml with new SQL queries & parameters
   ↓
3. Application code (Spring Boot & Next.js) remains unchanged!
```

1. **Update Schema & Seed**:
   - Edit `database/init.sql` to define your actual tables.
   - Edit `database/seed.sql` to insert actual seed/migration records.
2. **Update Tools**:
   - Edit `mcp-toolbox/tools.yaml` with your new queries, parameter types, and descriptions.
3. **Rebuild**:
   - Run `docker compose down -v && docker compose up --build -d`.
   - The MCP Toolbox automatically exposes the new tools, and the backend dynamically discovers them without requiring code modifications.
