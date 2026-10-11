"""
rag_backend.py

FastAPI backend for the motorcycle review RAG project. Wraps the hybrid
retrieval logic (semantic + keyword search, fused with RRF) from
query_chunks.py behind an HTTP API, and adds the final generation step:
sends the retrieved chunks + question to an LLM via OpenRouter, and
returns a grounded answer plus the sources it was based on.

Heavy resources (embedding model, BM25 index, ChromaDB connection,
chunks.jsonl) are loaded ONCE at startup, not per-request - this matters a
lot for a FastAPI service, since reloading a ~80MB model on every request
would make it unusably slow.

Run this on your own machine, in the same folder as chroma_db/ and
chunks.jsonl.

Setup (new packages beyond what you already have):
    pip install fastapi uvicorn httpx

Set your OpenRouter API key as an environment variable before running
(PowerShell):
    $env:OPENROUTER_API_KEY = "sk-or-v1-..."

Pick a free model from https://openrouter.ai/models?max_price=0 (free
models change over time, so check what's currently available) and set it,
or just edit OPENROUTER_MODEL below:
    $env:OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

Run the server:
    uvicorn rag_backend:app --reload --port 8000

Then open frontend/index.html in a browser (double-click it - it talks to
http://localhost:8000 directly, no need to serve it from FastAPI).
"""

import json
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import chromadb
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

# --- Config ---
DB_PATH = "./chroma_db"
COLLECTION_NAME = "motorcycle_reviews_v2"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # must match embed_chunks.py
CHUNKS_PATH = Path("chunks.jsonl")

CANDIDATE_POOL = 30
RRF_K = 60
DEFAULT_TOP_K = 5

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are a motorcycle review assistant. Answer the user's \
question using ONLY the review excerpts provided below - do not use any \
outside knowledge about motorcycles. Each excerpt is numbered.

If the excerpts don't contain enough information to answer confidently, \
say so honestly instead of guessing. When you make a claim, mention which \
excerpt number(s) it's based on, like this: "The seat height is 800mm [1]."."""

# --- Globals populated at startup (see lifespan below) ---
state = {}


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def load_chunks(path: Path) -> dict:
    chunks = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                chunks[rec["chunk_id"]] = rec
    return chunks


def matches_filter(record: dict, brand: Optional[str], motorcycle_id: Optional[str]) -> bool:
    if brand and record.get("brand") != brand:
        return False
    if motorcycle_id and record.get("motorcycle_id") != motorcycle_id:
        return False
    return True


def semantic_search(question: str, pool: int, brand, motorcycle_id) -> list[str]:
    embedding = state["model"].encode([question]).tolist()
    conditions = []
    if brand:
        conditions.append({"brand": brand})
    if motorcycle_id:
        conditions.append({"motorcycle_id": motorcycle_id})
    where = None
    if len(conditions) == 1:
        where = conditions[0]
    elif len(conditions) > 1:
        where = {"$and": conditions}

    results = state["collection"].query(
        query_embeddings=embedding,
        n_results=pool,
        where=where,
        include=[],
    )
    return results["ids"][0]


def keyword_search(question: str, pool: int, brand, motorcycle_id) -> list[str]:
    scores = state["bm25"].get_scores(tokenize(question))
    scored = list(zip(state["bm25_ids"], scores))
    scored = [(cid, s) for cid, s in scored
              if matches_filter(state["chunks"][cid], brand, motorcycle_id)]
    scored.sort(key=lambda x: -x[1])
    return [cid for cid, _ in scored[:pool]]


def rrf_fuse(rank_lists: list[list[str]], k: int = RRF_K) -> list[tuple[str, float]]:
    scores = {}
    for ranked_ids in rank_lists:
        for rank, cid in enumerate(ranked_ids, start=1):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: -x[1])


def retrieve(question: str, top_k: int, brand, motorcycle_id) -> list[dict]:
    semantic_ids = semantic_search(question, CANDIDATE_POOL, brand, motorcycle_id)
    keyword_ids = keyword_search(question, CANDIDATE_POOL, brand, motorcycle_id)
    fused = rrf_fuse([semantic_ids, keyword_ids])
    top_ids = [cid for cid, _ in fused[:top_k]]
    return [state["chunks"][cid] for cid in top_ids if cid in state["chunks"]]


def build_prompt(question: str, retrieved: list[dict]) -> str:
    blocks = []
    for i, chunk in enumerate(retrieved, start=1):
        bike = f"{chunk.get('brand', '')} {chunk.get('model', '')} {chunk.get('variant', '')}".strip()
        blocks.append(f"[{i}] ({bike}) {chunk['text']}")
    context = "\n\n".join(blocks)
    return f"Review excerpts:\n\n{context}\n\nQuestion: {question}"


async def call_llm(question: str, retrieved: list[dict]) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not set. Set it as an environment "
                   "variable before starting the server."
        )

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_prompt(question, retrieved)},
        ],
    }
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}"}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter error ({resp.status_code}): {resp.text[:300]}"
        )

    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail=f"Unexpected OpenRouter response: {data}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup: load everything ONCE ---
    if not CHUNKS_PATH.exists():
        raise RuntimeError(f"{CHUNKS_PATH} not found. Run chunk_transcripts.py first.")

    print("Loading chunks.jsonl ...")
    state["chunks"] = load_chunks(CHUNKS_PATH)
    print(f"Loaded {len(state['chunks'])} chunks.")

    print("Building BM25 keyword index ...")
    state["bm25_ids"] = list(state["chunks"].keys())
    tokenized = [tokenize(state["chunks"][cid]["text"]) for cid in state["bm25_ids"]]
    state["bm25"] = BM25Okapi(tokenized)

    print(f"Loading embedding model '{EMBEDDING_MODEL}' ...")
    state["model"] = SentenceTransformer(EMBEDDING_MODEL)

    print(f"Opening ChromaDB at {DB_PATH} ...")
    client = chromadb.PersistentClient(path=DB_PATH)
    state["collection"] = client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"Collection has {state['collection'].count()} chunks. Ready.")

    yield
    # --- shutdown: nothing to clean up ---


app = FastAPI(title="Motorcycle RAG API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for a local learning project; lock down for production
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str
    brand: Optional[str] = None
    motorcycle_id: Optional[str] = None
    top_k: int = DEFAULT_TOP_K


class Source(BaseModel):
    chunk_id: str
    motorcycle_id: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    variant: Optional[str]
    youtube_url: Optional[str]
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]


@app.get("/health")
def health():
    return {"status": "ok", "chunks_loaded": state["collection"].count()}


@app.get("/motorcycles")
def list_motorcycles():
    seen = {}
    for chunk in state["chunks"].values():
        mid = chunk.get("motorcycle_id")
        if mid and mid not in seen:
            seen[mid] = {
                "motorcycle_id": mid,
                "brand": chunk.get("brand"),
                "model": chunk.get("model"),
                "variant": chunk.get("variant"),
            }
    return sorted(seen.values(), key=lambda x: (x["brand"] or "", x["model"] or ""))


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question must not be empty")

    retrieved = retrieve(req.question, req.top_k, req.brand, req.motorcycle_id)
    if not retrieved:
        return AskResponse(
            answer="No relevant review content was found for that question/filter combination.",
            sources=[],
        )

    answer = await call_llm(req.question, retrieved)

    sources = [
        Source(
            chunk_id=c["chunk_id"],
            motorcycle_id=c.get("motorcycle_id"),
            brand=c.get("brand"),
            model=c.get("model"),
            variant=c.get("variant"),
            youtube_url=c.get("youtube_url"),
            snippet=c["text"][:280],
        )
        for c in retrieved
    ]
    return AskResponse(answer=answer, sources=sources)