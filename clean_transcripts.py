"""
clean_existing_transcripts.py

One-time fix for transcripts already collected by an older version of
collect_transcripts.py, which left literal HTML entities (like &nbsp;)
in the text instead of decoding them.

This rewrites every .txt file in the transcripts/ folder in place,
decoding HTML entities and collapsing extra whitespace. Safe to run
multiple times (it's a no-op on already-clean files).

Usage:
    python clean_existing_transcripts.py
"""

import html
import re
from pathlib import Path

TRANSCRIPTS_DIR = Path("transcripts")


def clean_transcript(text: str) -> str:
    text = html.unescape(text)        # &nbsp; -> \xa0, &amp; -> &, etc.
    text = text.replace("\xa0", " ")  # nbsp char -> regular space
    text = re.sub(r"\s+", " ", text)  # collapse any whitespace runs
    return text.strip()


def main():
    if not TRANSCRIPTS_DIR.exists():
        print(f"Folder not found: {TRANSCRIPTS_DIR.resolve()}")
        return

    files = sorted(TRANSCRIPTS_DIR.glob("*.txt"))
    if not files:
        print("No .txt files found in transcripts/.")
        return

    changed = 0
    for path in files:
        original = path.read_text(encoding="utf-8", errors="ignore")
        cleaned = clean_transcript(original)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            changed += 1

    print(f"Checked {len(files)} transcript files.")
    print(f"Cleaned {changed} files that had HTML entities or extra whitespace.")
    print(f"{len(files) - changed} files were already clean.")


if __name__ == "__main__":
    main()