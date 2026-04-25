---
name: llm-selector
description: >-
  Detects local machine hardware (RAM, CPU, GPU, OS) and recommends the best
  LLM runtime (Ollama, LM Studio, llama.cpp) and specific models to run locally.
  Use this when asked about running LLMs locally, which model to use, local AI
  setup, or comparing Ollama vs LM Studio vs llama.cpp.
allowed-tools: shell
---

# LLM Selector Skill

This skill helps you recommend the right local LLM runtime and models based on the user's actual hardware.

## How to use this skill

When the user asks about running LLMs locally, which model fits their machine, or wants to compare runtimes:

1. **Run the hardware detection script** from this skill's directory:
   ```
   bash detect-hardware.sh
   ```
   This outputs a JSON-like summary of RAM, CPU, GPU, OS, architecture, and any already-installed runtimes.

2. **Analyze the output** using the decision table below.

3. **Recommend** the best runtime(s) and 2–3 specific models with reasoning.

4. **Provide the exact install commands** for each recommendation.

---

## Decision Table

### By RAM (no GPU)

| Total RAM | Recommended Runtime | Recommended Models                                      | Reasoning                                          |
|-----------|--------------------|---------------------------------------------------------|----------------------------------------------------|
| < 8 GB    | Ollama             | `phi3:mini` (2.3GB), `tinyllama:1.1b` (1.1GB)          | Only small models fit; phi3:mini punches above weight |
| 8–16 GB   | Ollama             | `llama3:8b` (4.7GB), `mistral:7b` (4.1GB)              | Sweet spot — fast inference, good quality          |
| 16–32 GB  | Ollama             | `llama3:8b`, `codellama:13b` (7.4GB), `mistral:7b`     | 13B models run comfortably                         |
| 32–64 GB  | Ollama or LM Studio| `llama3:70b-q4_K_M` (39GB), `mixtral:8x7b` (26GB)      | Large models now viable with 4-bit quant           |
| 64 GB+    | LM Studio / Ollama | `llama3:70b` (full), `mixtral:8x7b`, `codellama:34b`   | Run large models at higher precision               |

### By GPU

| GPU                  | Recommended Runtime    | Notes                                                     |
|----------------------|------------------------|-----------------------------------------------------------|
| Apple Silicon (M-chip) | Ollama (Metal)       | Best-in-class CPU+GPU unified memory; use Metal backend   |
| NVIDIA ≥ 8GB VRAM    | Ollama or llama.cpp    | Full GPU offload; use CUDA backend                        |
| NVIDIA < 8GB VRAM    | Ollama (partial offload)| Offload some layers; rest on CPU RAM                    |
| AMD GPU (Linux)      | llama.cpp (ROCm)       | Requires ROCm build of llama.cpp                          |

### Apple Silicon special cases (unified memory)

For Apple M-series chips, RAM IS the GPU VRAM — use the full RAM figure:
- M1/M2 8GB → `phi3:mini`, `llama3:8b-q4`
- M1/M2 16GB → `llama3:8b`, `mistral:7b`
- M2/M3 Pro 32–36GB → `llama3:70b-q4_K_M`, `mixtral:8x7b`
- M3/M4 Max 64–128GB → `llama3:70b` full precision, `mixtral:8x7b`

---

## Runtime Comparison

| Runtime   | Best for                        | Install                          | Pros                              | Cons                          |
|-----------|---------------------------------|----------------------------------|-----------------------------------|-------------------------------|
| Ollama    | Getting started fast            | `brew install ollama`            | Simple CLI, huge model library    | Less control over params      |
| LM Studio | GUI + OpenAI-compatible server  | Download from lmstudio.ai        | Visual model browser, easy server | Requires GUI                  |
| llama.cpp | Max control / performance       | `brew install llama.cpp`         | Fastest, most configurable        | CLI only, more setup          |

---

## Install Commands by Runtime

### Ollama
```bash
# Install
brew install ollama

# Start server
ollama serve

# Pull and run a model
ollama pull llama3:8b
ollama run llama3:8b
```

### LM Studio
```bash
# Download from website
open https://lmstudio.ai

# Or via brew cask
brew install --cask lm-studio
```

### llama.cpp
```bash
brew install llama.cpp

# Download a GGUF model, then run:
llama-cli -m /path/to/model.gguf -p "Your prompt here"
```

---

## Response Format

Structure your recommendation like this:

```
## Your Hardware
[summary of detected specs]

## Recommended Runtime: [Name]
[1-2 sentence reason why this runtime fits their machine]

## Recommended Models

### 1. [model:tag] (~XGB RAM)
- Why: [specific reasoning based on their RAM/GPU]
- Install: `ollama pull model:tag`
- Run: `ollama run model:tag`

### 2. [model:tag] (~XGB RAM)
...

## Alternative
[If they want to try something different, one alternative runtime + model]
```

---

## Important Notes

- Always check `installed_runtimes` in the hardware output — if Ollama is already installed, prioritize it
- For coding tasks: prefer `codellama` or `deepseek-coder` variants
- For general chat: prefer `llama3` or `mistral`
- For low RAM: always recommend quantized models (q4_K_M is the best quality/size tradeoff)
- Remind users: models are downloaded on first `ollama pull` — ensure disk space is sufficient
