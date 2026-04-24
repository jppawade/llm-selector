# llm-selector — Project Plan

## Problem
Build a locally-installed web app (Next.js + FastAPI) that:
1. Detects local machine specs (RAM, GPU, CPU, disk, OS)
2. Uses GitHub Copilot AI (same auth as local Copilot CLI via `GH_TOKEN`) to recommend LLM runtimes and models suited to your hardware
3. Lets you reason/chat with Copilot about those recommendations before deciding
4. Provides install commands for the chosen runtime + model

## Architecture

```
┌──────────────────────────────────────────┐
│           Next.js Frontend (port 3000)    │
│  ┌────────────────┐  ┌─────────────────┐  │
│  │  System Info   │  │  Copilot Chat   │  │
│  │  Panel         │  │  (SSE stream)   │  │
│  └────────────────┘  └─────────────────┘  │
│  ┌───────────────────────────────────┐    │
│  │  Model Recommendations            │    │
│  │  (runtime + model cards w/        │    │
│  │   reasoning + install cmds)       │    │
│  └───────────────────────────────────┘    │
└──────────────────┬───────────────────────┘
                   │ REST + SSE
┌──────────────────▼───────────────────────┐
│           FastAPI Backend (port 8000)     │
│  /api/system-info   → hardware detection  │
│  /api/recommend     → Copilot AI call     │
│  /api/chat          → SSE streaming chat  │
└──────────────────┬───────────────────────┘
                   │ HTTPS + Bearer GH_TOKEN
┌──────────────────▼───────────────────────┐
│   GitHub Copilot API                      │
│   api.githubcopilot.com/chat/completions  │
│   (same service the local CLI uses)       │
└──────────────────────────────────────────┘
```

## Copilot CLI Connection
The app authenticates using the `GH_TOKEN` environment variable — the same PAT that
Copilot CLI uses with **"Copilot Requests"** permission. This means the app uses the
exact same GitHub Copilot service as the local CLI — no separate account needed.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), psutil, httpx (async HTTP)
- **Auth**: `GH_TOKEN` env var → GitHub Copilot completions API
- **Repo**: `jppawade/llm-selector`

## Project Structure
```
llm-selector/
├── .plan/               ← this directory
│   └── README.md
├── backend/             ← FastAPI
│   ├── main.py
│   ├── system_info.py
│   ├── copilot_client.py
│   ├── model_advisor.py
│   └── requirements.txt
├── frontend/            ← Next.js
│   ├── app/
│   │   ├── page.tsx
│   │   └── api/
│   ├── components/
│   │   ├── SystemInfo.tsx
│   │   ├── ModelCard.tsx
│   │   └── CopilotChat.tsx
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## System Detection (backend/system_info.py)
- **RAM**: `psutil.virtual_memory()`
- **CPU**: `psutil.cpu_count()`, `platform.processor()`
- **GPU**: `nvidia-smi` (Linux/Windows NVIDIA), `system_profiler SPDisplaysDataType` (macOS Apple Silicon)
- **Disk**: `shutil.disk_usage('/')`
- **OS**: `platform.system()`, `platform.machine()`
- **Existing runtimes**: check if `ollama`, `lms` (LM Studio) binaries are in PATH

## Model Recommendation Logic (backend/model_advisor.py)
Hardware profiles map to runtime + model suggestions:

| RAM     | GPU          | Suggested Runtime    | Suggested Models             |
|---------|--------------|----------------------|------------------------------|
| <8GB    | None         | Ollama               | phi3:mini, tinyllama         |
| 8–16GB  | None         | Ollama               | llama3:8b, mistral:7b        |
| 16–32GB | None         | Ollama               | llama3:8b, codellama:13b     |
| 32GB+   | None         | LM Studio / Ollama   | llama3:70b (4-bit), mixtral  |
| Any     | NVIDIA ≥8GB  | llama.cpp / Ollama   | Full precision models        |
| macOS   | Apple M-chip | Ollama (Metal)       | llama3, mistral, phi3        |

Copilot AI enhances this: given actual specs, it explains *why* a model fits,
quantization tradeoffs, performance expectations, and answers follow-up questions.

## API Endpoints
| Method | Path              | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | /api/system-info  | Returns detected hardware specs          |
| POST   | /api/recommend    | Calls Copilot API, returns recommendations + reasoning |
| POST   | /api/chat         | SSE streaming chat for follow-up Q&A     |

## Frontend Panels
1. **System Info card** — RAM, CPU, GPU, disk, OS at a glance
2. **Recommendations panel** — 3–5 model cards with: runtime, model name, reasoning, install command, copy button
3. **Copilot Chat panel** — Ask follow-up questions, streamed responses

## Build Order / Todos
1. `scaffold-backend` — FastAPI skeleton + CORS + health check
2. `system-detection` — Hardware detection service
3. `copilot-integration` — GH_TOKEN auth + Copilot API client
4. `model-advisor` — Recommendation logic + prompt engineering
5. `scaffold-frontend` — Next.js skeleton + Tailwind
6. `ui-polish` — Components: SystemInfo, ModelCard, CopilotChat
7. `docs` — README with setup instructions
8. `github-repo` — Push to `jppawade/llm-selector`

## Security Notes
- `.env` and `.env.local` are **gitignored** — `GH_TOKEN` is never committed
- See `.env.example` for required variables
