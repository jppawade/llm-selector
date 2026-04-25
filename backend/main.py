import os
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from system_info import get_system_info
from copilot_client import get_recommendations, stream_chat

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="llm-selector API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list[dict]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/system-info")
async def system_info():
    try:
        return get_system_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommend")
async def recommend():
    try:
        specs = get_system_info()
        reasoning = await get_recommendations(specs)
        return {"system": specs, "recommendations": reasoning}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat(request: ChatRequest):
    async def event_generator():
        try:
            async for chunk in stream_chat(request.messages):
                yield {"data": json.dumps({"content": chunk})}
        except ValueError as e:
            yield {"data": json.dumps({"error": str(e)})}
        except Exception as e:
            yield {"data": json.dumps({"error": f"Copilot API error: {str(e)}"})}
        yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())
