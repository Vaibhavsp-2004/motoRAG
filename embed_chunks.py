"""
embed_chunks.py

Reads chunks.jsonl (produced by chunk_transcripts.py), turns every chunk's
text into a vector using a free local embedding model (sentence-transformers),
and stores each chunk + its vector + its metadata in a local ChromaDB
collection so it can be searched later.

Run this on your own machine, in the same folder as chunks.jsonl.

Setup (one time):
    pip install sentence-transformers chromadb

Usage:
    python embed_chunks.py

Output:
    - a chroma_db/ folder next to this script, containing the persistent
      vector database. You query it later with a separate script.
"""

import json
from pathlib import Path

from sentence_transformers import SentenceTransformer
import chromadb

CHUNKS_PATH = Path("chunks.jsonl")
DB_PATH = "./chroma_db"
COLLECTION_NAME = "motorcycle_reviews_v2"

# all-MiniLM-L6-v2: small (~80MB), fast, free, runs on CPU, 384-dim vectors.
# Good default for a first RAG project - upgrade later if retrieval quality
# needs it (e.g. to a larger sentence-transformers model).
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

BATCH_SIZE = 64


def load_chunks(path: Path) -> list[dict]:
    chunks = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks


def sanitize_metadata(chunk: dict) -> dict:
    """
    ChromaDB metadata values must be str/int/float/bool - no None.
    Pull out everything except the id/text (those are stored separately).
    """
    fields = ["motorcycle_id", "brand", "model", "variant", "body_type",
              "segment_group", "youtube_url", "chunk_index", "word_count"]
    meta = {}
    for f in fields:
        val = chunk.get(f)
        meta[f] = val if val is not None else ""
    return meta


def main():
    if not CHUNKS_PATH.exists():
        print(f"File not found: {CHUNKS_PATH.resolve()}")
        print("Run chunk_transcripts.py first to generate chunks.jsonl.")
        return

    print(f"Loading chunks from {CHUNKS_PATH} ...")
    chunks = load_chunks(CHUNKS_PATH)
    print(f"Loaded {len(chunks)} chunks.")

    print(f"Loading embedding model '{EMBEDDING_MODEL}' (first run downloads it, ~80MB) ...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print(f"Opening ChromaDB at {DB_PATH} ...")
    client = chromadb.PersistentClient(path=DB_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    already_stored = set(collection.get()["ids"]) if collection.count() > 0 else set()
    if already_stored:
        print(f"Collection already has {len(already_stored)} chunks stored - "
              f"skipping those and only adding new ones.")

    pending = [c for c in chunks if c["chunk_id"] not in already_stored]
    print(f"{len(pending)} chunks left to embed and store.")

    added = 0
    for i in range(0, len(pending), BATCH_SIZE):
        batch = pending[i:i + BATCH_SIZE]
        # embed the bike-identity-prefixed text (falls back to plain text
        # for chunks.jsonl files produced before this field existed)
        embed_texts = [c.get("embedding_text", c["text"]) for c in batch]
        display_texts = [c["text"] for c in batch]
        ids = [c["chunk_id"] for c in batch]
        metadatas = [sanitize_metadata(c) for c in batch]

        embeddings = model.encode(embed_texts, show_progress_bar=False).tolist()

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=display_texts,
            metadatas=metadatas,
        )
        added += len(batch)
        print(f"  ... embedded and stored {added}/{len(pending)}")

    print("\n--- Summary ---")
    print(f"Total chunks in collection now: {collection.count()}")
    print(f"Newly added this run:           {added}")
    print(f"Vector database saved to:       {Path(DB_PATH).resolve()}")


if __name__ == "__main__":
    main()