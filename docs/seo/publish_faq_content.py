# -*- coding: utf-8 -*-
"""Publish the FAQ entries from docs/seo/faq-page-content.md into public.faqs.

Existing rows with page_key='general' are kept; entries whose question matches an
existing one are skipped so nothing is duplicated. New rows start at sort_order 100.

Usage:
  python docs/seo/publish_faq_content.py           # dry-run
  python docs/seo/publish_faq_content.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SOURCE = Path("docs/seo/faq-page-content.md")
START_ORDER = 100

# Questions already answered by the three existing general rows.
EXISTING_QUESTIONS = {
    "do you provide free quotation",
    "can you help with condo management approval",
    "which areas does flash cast serve",
}

# Entries that restate an existing question in different words. The existing rows
# already carry Malay, so they stay and these are dropped.
SKIP_NUMBERS = {1, 13, 25}


def normalize(text):
    return re.sub(r"[^a-z ]+", "", text.lower()).strip()


def parse_faqs():
    text = SOURCE.read_text(encoding="utf-8")
    # Each entry starts with **N. question?**
    chunks = re.split(r"^\*\*(\d+)\.\s+", text, flags=re.M)
    entries = []
    for i in range(1, len(chunks), 2):
        number = int(chunks[i])
        body = chunks[i + 1]
        question = body.split("\n", 1)[0].strip().rstrip("*").strip()
        question = re.sub(r"[\s?？]+$", "", question).strip()
        # English answer: first fenced block after the question.
        en = re.search(r"```[a-z]*\r?\n(.*?)```", body, re.S)
        en_answer = en.group(1).strip() if en else ""
        # Chinese answer: the **中文**： prefix, up to the next horizontal rule.
        zh = re.search(r"\*\*中文\*\*[：:]\s*(.+?)(?:\n---|\n\*\*|$)", body, re.S)
        zh_answer = re.sub(r"\s+", " ", zh.group(1)).strip() if zh else ""
        entries.append({
            "number": number,
            "question_en": question,
            "answer_en": en_answer,
            "answer_zh": zh_answer,
        })
    return entries


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    entries = parse_faqs()
    print(f"parsed: {len(entries)} entries")

    # Fetch existing questions to avoid duplicates.
    req = urllib.request.Request(
        f"{url}/rest/v1/faqs?select=question_en&page_key=eq.general&status=eq.published",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        existing = {normalize(row.get("question_en") or "") for row in json.loads(r.read().decode())}
    existing |= EXISTING_QUESTIONS

    publishable = []
    skipped = []
    missing = []
    for e in entries:
        if e["number"] in SKIP_NUMBERS:
            skipped.append((e["number"], e["question_en"][:50]))
            continue
        if not e["answer_en"] or not e["answer_zh"]:
            missing.append((e["number"], e["question_en"][:50]))
            continue
        if normalize(e["question_en"]) in existing:
            skipped.append((e["number"], e["question_en"][:50]))
            continue
        publishable.append(e)

    print(f"to publish: {len(publishable)} | duplicate: {len(skipped)} | incomplete: {len(missing)}")
    for n, q in skipped:
        print(f"  skip  #{n} {q}")
    for n, q in missing:
        print(f"  incomplete #{n} {q}")

    if not publish:
        print("\ndry-run only. Re-run with --publish to insert.")
        return 0

    inserted = 0
    failed = 0
    order = START_ORDER
    for e in publishable:
        record = {
            "page_key": "general",
            "question_en": e["question_en"],
            "answer_en": e["answer_en"],
            "answer_zh": e["answer_zh"],
            "status": "published",
            "sort_order": order,
        }
        body = json.dumps(record).encode("utf-8")
        req = urllib.request.Request(
            f"{url}/rest/v1/faqs",
            method="POST",
            data=body,
            headers={
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                row = json.loads(r.read().decode("utf-8", "ignore"))[0]
                inserted += 1
                print(f"OK   #{e['number']:<3} sort={order:<4} id={row['id'][:8]}")
                order += 10
        except urllib.error.HTTPError as err:
            failed += 1
            print(f"FAIL #{e['number']} {err.code} {err.read().decode('utf-8','ignore')[:150]}")
    print(f"\ndone: inserted={inserted} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
