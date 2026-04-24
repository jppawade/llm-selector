# llm-selector

> A locally-installed web app that detects your hardware and uses GitHub Copilot AI to recommend the best LLM runtimes and models for your machine.

## What it does
1. **Detects your hardware** — RAM, CPU, GPU, disk, OS
2. **Recommends LLM runtimes & models** — Ollama, LM Studio, llama.cpp — matched to your specs with AI reasoning
3. **Chat with Copilot** — Ask follow-up questions about recommendations using the same GitHub Copilot service as the local CLI

## Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: GitHub Copilot API (via `GH_TOKEN`)

## Setup
See [.plan/README.md](.plan/README.md) for full architecture and build plan.

> Setup instructions will be added as the app is built.

## License
MIT
