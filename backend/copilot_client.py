import os
import httpx
from typing import AsyncIterator

COPILOT_API_URL = "https://api.githubcopilot.com/chat/completions"

SYSTEM_PROMPT = """You are an expert LLM deployment advisor for local machine setups.
Given a user's hardware specifications, you recommend the best local LLM runtimes 
(Ollama, LM Studio, llama.cpp) and specific models (llama3, mistral, phi3, codellama, etc).

Always explain:
1. WHY a runtime fits their hardware
2. WHY specific models are recommended (RAM fit, quantization level, performance expectation)
3. Tradeoffs between options
4. The exact install commands to get started

Be specific, practical, and concise. Format model recommendations as a clear list."""


def _get_token() -> str:
    token = os.getenv("GH_TOKEN")
    if not token:
        raise ValueError("GH_TOKEN environment variable not set. "
                         "Create a PAT with 'Copilot Requests' permission.")
    return token


def _build_headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "editor-version": "llm-selector/1.0",
        "editor-plugin-version": "llm-selector/1.0",
        "user-agent": "llm-selector/1.0",
    }


async def get_recommendations(system_info: dict) -> str:
    prompt = f"""My local machine specs:
- OS: {system_info['os']} ({system_info['arch']})
- RAM: {system_info['ram']['total_gb']}GB total, {system_info['ram']['available_gb']}GB available
- CPU: {system_info['cpu']['model']} ({system_info['cpu']['physical_cores']} physical cores)
- GPU: {system_info['gpu']['name'] or 'None detected'} | VRAM: {system_info['gpu']['vram_gb'] or 'N/A'}GB | Type: {system_info['gpu']['type'] or 'none'}
- Disk free: {system_info['disk']['free_gb']}GB
- Already installed runtimes: {', '.join(system_info['installed_runtimes']) or 'none'}

Based on these specs, recommend the best LLM runtimes and models I should run locally.
For each recommendation include:
- Runtime name and why it fits my hardware
- 2-3 specific model names with quantization (e.g. llama3:8b-q4_K_M)
- Expected RAM usage per model
- One-line install command for each model"""

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1500,
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(COPILOT_API_URL, json=payload, headers=_build_headers())
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def stream_chat(messages: list[dict]) -> AsyncIterator[str]:
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "max_tokens": 1000,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST", COPILOT_API_URL, json=payload, headers=_build_headers()
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    chunk = line[6:]
                    if chunk.strip() == "[DONE]":
                        break
                    import json
                    try:
                        data = json.loads(chunk)
                        delta = data["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
