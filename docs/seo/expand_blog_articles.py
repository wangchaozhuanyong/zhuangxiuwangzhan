# -*- coding: utf-8 -*-
"""Expand thin blog articles while keeping the existing topic and SEO fields.

Writes whole content fields, guarded by updated_at, and refuses any article whose
new English body is shorter than the floor. Supports several articles per file.

Usage:
  python docs/seo/expand_blog_articles.py tmp/expand-1.json            # dry-run
  python docs/seo/expand_blog_articles.py tmp/expand-1.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Minimum body length per field, measured on the stored HTML.
FLOORS = {"content_en": 2500, "content_zh": 1200, "content_ms": 2500}


def main():
    if len(sys.argv) < 2:
        print("usage: expand_blog_articles.py <file.json> [--publish]")
        return 1
    source = Path(sys.argv[1])
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    payload = json.loads(source.read_text(encoding="utf-8"))
    articles = payload if isinstance(payload, list) else [payload]

    # Check every floor before writing anything.
    problems = []
    for art in articles:
        slug = art["slug"]
        for field, floor in FLOORS.items():
            body = art.get(field) or ""
            if len(body) < floor:
                problems.append(f"{slug} {field}: {len(body)} < {floor}")
        for field in ("content_en", "content_zh", "content_ms"):
            if not art.get(field):
                problems.append(f"{slug} missing {field}")
    if problems:
        print("REFUSED — below floor or incomplete:")
        for p in problems:
            print("  " + p)
        return 1

    ok = failed = 0
    for art in articles:
        slug = art["slug"]
        req = urllib.request.Request(
            f"{url}/rest/v1/blog_posts?select=id,slug,updated_at,content_en,content_zh,content_ms&slug=eq.{slug}",
            headers={"apikey": key, "Authorization": "Bearer " + key},
        )
        rows = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))
        if not rows:
            print(f"{slug}: NOT FOUND")
            failed += 1
            continue
        row = rows[0]

        updates = {f: art[f] for f in ("content_en", "content_zh", "content_ms")}
        print(f"{slug}")
        for f in ("content_en", "content_zh", "content_ms"):
            print(f"   {f}: {len(row.get(f) or '')} -> {len(updates[f])}")

        if not publish:
            continue

        query = urllib.parse.urlencode({"slug": f"eq.{slug}", "updated_at": f"eq.{row['updated_at']}"})
        patch = urllib.request.Request(
            f"{url}/rest/v1/blog_posts?{query}",
            method="PATCH",
            data=json.dumps(updates).encode("utf-8"),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Content-Type": "application/json", "Prefer": "return=representation"},
        )
        try:
            with urllib.request.urlopen(patch, timeout=45) as r:
                written = json.loads(r.read().decode("utf-8", "ignore") or "[]")
            if not written:
                print("   ! optimistic lock mismatch")
                failed += 1
            else:
                ok += 1
                print("   -> written")
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"   ! FAIL {e.code} {e.read().decode('utf-8','ignore')[:120]}")

    if publish:
        print(f"\ndone: ok={ok} failed={failed}")
    else:
        print("\ndry-run only. Re-run with --publish to write.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
