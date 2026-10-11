"""
query_chunks.py

Retrieval-only step: combines two search strategies and fuses the results,
then prints the top chunks with their source metadata. No LLM generation
here on purpose - this lets you sanity-check that retrieval itself is
finding the right chunks before adding an LLM on top.

  - Semantic search: embeds the question, searches ChromaDB for chunks
    with the closest meaning. Good at paraphrase/synonyms, weak when a
    specific fact is buried in a chunk full of other topics.
  - Keyword search (BM25): scores chunks by exact term overlap. Weak at
    paraphrase, but reliably surfaces a chunk that literally contains the
    words you asked about, even if it's not "about" that topic overall.

Results from both are combined with Reciprocal Rank Fusion (RRF): a
chunk's fused score is the sum of 1/(60+rank) across whichever list(s)
it appears in. A chunk that ranks well in either search gets pulled up;
one that ranks well in both gets pulled up more. No manual weight tuning
needed - this is the standard, well-established way to combine the two.

Run this on your own machine, in the same folder as chroma_db/ and
chunks.jsonl (the keyword index is built fresh from chunks.jsonl each run).

Setup (one new package):
    pip install rank_bm25

Usage:
    python query_chunks.py "What is the seat height of the Aprilia RS 457?"
    python query_chunks.py "seat height" --brand "Royal Enfield"
    python query_chunks.py "engine power" --top-k 3
    python query_chunks.py "seat height" --motorcycle-id aprilia_rs_457_standard
    python query_chunks.py "seat height" --semantic-only   # old behavior, for comparison

    # no question given -> interactive mode, ask multiple questions in a row
    python query_chunks.py
"""

import argparse
import json
import re
import textwrap
from pathlib import Path

from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import chromadb

DB_PATH = "./chroma_db"
COLLECTION_NAME = "motorcycle_reviews_v2"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # must match embed_chunks.py
CHUNKS_PATH = Path("chunks.jsonl")

DEFAULT_TOP_K = 5
CANDIDATE_POOL = 30  # how many results to pull from each search before fusing
RRF_K = 60           # standard damping constant for reciprocal rank fusion


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def load_chunks(path: Path) -> dict:
    """Return {chunk_id: full chunk record} for display and BM25 indexing."""
    chunks = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                chunks[rec["chunk_id"]] = rec
    return chunks


def matches_filter(record: dict, brand: str | None, motorcycle_id: str | None) -> bool:
    if brand and record.get("brand") != brand:
        return False
    if motorcycle_id and record.get("motorcycle_id") != motorcycle_id:
        return False
    return True


def semantic_search(collection, model, question: str, pool: int,
                     brand: str | None, motorcycle_id: str | None) -> list[str]:
    """Returns a list of chunk_ids, best match first."""
    embedding = model.encode([question]).tolist()

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

    results = collection.query(
        query_embeddings=embedding,
        n_results=pool,
        where=where,
        include=[],  # we only need ids; text/metadata come from chunks.jsonl
    )
    return results["ids"][0]


def keyword_search(bm25, bm25_ids: list[str], chunks: dict, question: str, pool: int,
                    brand: str | None, motorcycle_id: str | None) -> list[str]:
    """Returns a list of chunk_ids, best match first."""
    scores = bm25.get_scores(tokenize(question))
    scored = list(zip(bm25_ids, scores))
    scored = [(cid, s) for cid, s in scored
              if matches_filter(chunks[cid], brand, motorcycle_id)]
    scored.sort(key=lambda x: -x[1])
    return [cid for cid, _ in scored[:pool]]


def rrf_fuse(rank_lists: list[list[str]], k: int = RRF_K) -> list[tuple[str, float]]:
    scores = {}
    for ranked_ids in rank_lists:
        for rank, cid in enumerate(ranked_ids, start=1):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: -x[1])


def print_results(fused: list[tuple[str, float]], chunks: dict, top_k: int,
                   semantic_ids: list[str], keyword_ids: list[str]):
    if not fused:
        print("No results found (try removing filters, or check the collection isn't empty).")
        return

    for rank, (cid, score) in enumerate(fused[:top_k], start=1):
        record = chunks.get(cid)
        if not record:
            continue
        bike = f"{record.get('brand', '')} {record.get('model', '')} {record.get('variant', '')}".strip()
        sem_rank = semantic_ids.index(cid) + 1 if cid in semantic_ids else None
        kw_rank = keyword_ids.index(cid) + 1 if cid in keyword_ids else None
        signal = f"semantic #{sem_rank}" if sem_rank else "semantic: -"
        signal += f", keyword #{kw_rank}" if kw_rank else ", keyword: -"

        print(f"\n[{rank}] {bike}  (chunk: {cid}, fused score: {score:.4f})")
        print(f"    {signal}")
        print(f"    source: {record.get('youtube_url', 'n/a')}")
        snippet = textwrap.shorten(record["text"], width=280, placeholder=" ...")
        print(f"    \"{snippet}\"")


def run_query(collection, model, bm25, bm25_ids, chunks, question: str, top_k: int,
              brand: str | None, motorcycle_id: str | None, semantic_only: bool):
    print(f"\n=== Query: \"{question}\" ===")

    semantic_ids = semantic_search(collection, model, question, CANDIDATE_POOL, brand, motorcycle_id)

    if semantic_only:
        fused = [(cid, 0.0) for cid in semantic_ids]
        print_results(fused, chunks, top_k, semantic_ids, [])
        return

    keyword_ids = keyword_search(bm25, bm25_ids, chunks, question, CANDIDATE_POOL, brand, motorcycle_id)
    fused = rrf_fuse([semantic_ids, keyword_ids])
    print_results(fused, chunks, top_k, semantic_ids, keyword_ids)


def main():
    parser = argparse.ArgumentParser(description="Query the motorcycle review vector store (hybrid search).")
    parser.add_argument("question", nargs="?", default=None,
                         help="The question to search for. Omit for interactive mode.")
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K,
                         help=f"Number of chunks to show (default: {DEFAULT_TOP_K})")
    parser.add_argument("--brand", type=str, default=None,
                         help="Optional: only search chunks from this brand (exact match)")
    parser.add_argument("--motorcycle-id", type=str, default=None,
                         help="Optional: only search chunks from this exact motorcycle_id")
    parser.add_argument("--semantic-only", action="store_true",
                         help="Disable keyword search and RRF fusion - old pure-vector behavior")
    args = parser.parse_args()

    if not CHUNKS_PATH.exists():
        print(f"File not found: {CHUNKS_PATH.resolve()}")
        print("Run chunk_transcripts.py first to generate chunks.jsonl.")
        return

    print("Loading chunks.jsonl ...")
    chunks = load_chunks(CHUNKS_PATH)
    print(f"Loaded {len(chunks)} chunks.")

    bm25 = None
    bm25_ids = None
    if not args.semantic_only:
        print("Building keyword (BM25) index ...")
        bm25_ids = list(chunks.keys())
        tokenized = [tokenize(chunks[cid]["text"]) for cid in bm25_ids]
        bm25 = BM25Okapi(tokenized)

    print(f"Loading embedding model '{EMBEDDING_MODEL}' ...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print(f"Opening ChromaDB at {DB_PATH} ...")
    client = chromadb.PersistentClient(path=DB_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"Collection has {collection.count()} chunks.")

    if args.question:
        run_query(collection, model, bm25, bm25_ids, chunks, args.question,
                   args.top_k, args.brand, args.motorcycle_id, args.semantic_only)
        return

    print("\nInteractive mode - type a question and press Enter. Type 'quit' to exit.")
    while True:
        question = input("\n> ").strip()
        if not question:
            continue
        if question.lower() in ("quit", "exit"):
            break
        run_query(collection, model, bm25, bm25_ids, chunks, question,
                   args.top_k, args.brand, args.motorcycle_id, args.semantic_only)


if __name__ == "__main__":
    main()