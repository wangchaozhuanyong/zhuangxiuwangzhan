# -*- coding: utf-8 -*-
"""Insert a price-reference section before the first h2 of a blog article.

Keeps the existing article intact and prepends one new section, so the article is
enriched rather than rewritten. Uses optimistic locking on updated_at.

Usage:
  python docs/seo/insert_price_section.py tmp/price-sections.json            # dry-run
  python docs/seo/insert_price_section.py tmp/price-sections.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

FIELDS = {"en": "content_en", "zh": "content_zh", "ms": "content_ms"}


def main():
    if len(sys.argv) < 2:
        print("usage: insert_price_section.py <sections.json> [--publish]")
        return 1
    source = Path(sys.argv[1])
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    sections = json.loads(source.read_text(encoding="utf-8"))
    ok = failed = 0

    for slug, langs in sections.items():
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

        updates = {}
        problems = []
        for lang, field in FIELDS.items():
            block = langs.get(lang)
            if not block:
                continue
            current = row.get(field) or ""
            if not current:
                problems.append(f"{lang}: empty content")
                continue
            if "Budget reference before you compare" in current or "比价之前先看预算参考" in current or "Rujukan belanjawan sebelum membandingkan" in current or "Indicative bands before you plan" in current or "规划之前先看参考区间" in current or "Julat indikatif sebelum anda merancang" in current:
                problems.append(f"{lang}: price section already present")
                continue
            idx = current.find("<h2")
            if idx < 0:
                problems.append(f"{lang}: no h2 anchor")
                continue
            updates[field] = current[:idx] + block + current[idx:]

        print(f"{slug}")
        for lang, field in FIELDS.items():
            before = len(row.get(field) or "")
            after = len(updates.get(field) or "")
            status = f"{before} -> {after}" if after else f"{before} (unchanged)"
            print(f"   {lang}: {status}")
        for p in problems:
            print(f"   ! {p}")

        if not updates:
            failed += 1
            continue
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
