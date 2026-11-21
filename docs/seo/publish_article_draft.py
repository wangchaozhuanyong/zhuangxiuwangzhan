# -*- coding: utf-8 -*-
"""Publish a prepared article draft into blog_posts with optimistic locking.

Reads the draft JSON, patches only the fields it carries, and refuses to write if the
row's updated_at no longer matches the draft's expectation.

Usage:
  python docs/seo/publish_article_draft.py "<path to article-draft.json>"            # dry-run
  python docs/seo/publish_article_draft.py "<path to article-draft.json>" --publish
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print("usage: publish_article_draft.py <draft.json> [--publish]")
        return 1
    draft_path = Path(sys.argv[1])
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    draft = json.loads(draft_path.read_text(encoding="utf-8"))
    row_id = draft["sourceRowId"]
    expected = draft["expectedUpdatedAt"]
    fields = draft.get("fields") or {}
    if not fields:
        print("draft carries no fields")
        return 1

    # Read current state first.
    req = urllib.request.Request(
        f"{url}/rest/v1/blog_posts?select=id,slug,status,updated_at,"
        f"content_en,content_zh,content_ms&id=eq.{row_id}",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    rows = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))
    if not rows:
        print(f"row {row_id} not found")
        return 1
    row = rows[0]

    print(f"slug      : {row['slug']}")
    print(f"status    : {row['status']}")
    print(f"updated_at: {row['updated_at']}")
    print(f"expected  : {expected}")

    for name, value in fields.items():
        before = len(row.get(name) or "")
        print(f"  {name}: {before} -> {len(value)} chars")

    if not publish:
        print("\ndry-run only. Re-run with --publish to write.")
        return 0

    # Optimistic lock: only update if updated_at still matches.
    query = urllib.parse.urlencode({"id": f"eq.{row_id}", "updated_at": f"eq.{expected}"})
    patch = urllib.request.Request(
        f"{url}/rest/v1/blog_posts?{query}",
        method="PATCH",
        data=json.dumps(fields).encode("utf-8"),
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(patch, timeout=45) as r:
            written = json.loads(r.read().decode("utf-8", "ignore") or "[]")
    except urllib.error.HTTPError as e:
        print(f"FAIL {e.code} {e.read().decode('utf-8', 'ignore')[:200]}")
        return 1

    if not written:
        print("FAIL: optimistic lock did not match; the row changed since the draft was made.")
        return 1

    out = written[0]
    print(f"\nwritten: en {len(out.get('content_en') or '')} | "
          f"zh {len(out.get('content_zh') or '')} | ms {len(out.get('content_ms') or '')}")
    print(f"new updated_at: {out.get('updated_at')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
