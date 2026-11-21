# -*- coding: utf-8 -*-
"""Update SEO descriptions with a length guard.

Meta descriptions are truncated in search results, so each value is checked against a
per-script limit before writing. Refuses the whole run if any value overruns.

Usage:
  python docs/seo/update_seo_descriptions.py tmp/seo-descriptions.json            # dry-run
  python docs/seo/update_seo_descriptions.py tmp/seo-descriptions.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Rough truncation limits: Latin descriptions around 160, Chinese around 80.
LIMITS = {"en": 160, "zh": 80, "ms": 160}


def limit_for(field):
    return LIMITS.get(field.rsplit("_", 1)[-1], 160)


def main():
    if len(sys.argv) < 2:
        print("usage: update_seo_descriptions.py <descriptions.json> [--publish]")
        return 1
    source = Path(sys.argv[1])
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    payload = json.loads(source.read_text(encoding="utf-8"))

    overruns = []
    for slug, fields in payload.items():
        for field, value in fields.items():
            cap = limit_for(field)
            if len(value) > cap:
                overruns.append((slug, field, len(value), cap))
    if overruns:
        print("REFUSED — these exceed the truncation limit:")
        for slug, field, n, cap in overruns:
            print(f"  {slug} {field}: {n} > {cap}")
        return 1

    ok = failed = 0
    for slug, fields in payload.items():
        req = urllib.request.Request(
            f"{url}/rest/v1/blog_posts?select=id,slug,updated_at&slug=eq.{slug}",
            headers={"apikey": key, "Authorization": "Bearer " + key},
        )
        rows = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))
        if not rows:
            print(f"{slug}: NOT FOUND")
            failed += 1
            continue
        row = rows[0]

        print(f"{slug}")
        for field, value in fields.items():
            print(f"   {field}: {len(value)} chars (limit {limit_for(field)}) {value[:70]}")

        if not publish:
            continue

        query = urllib.parse.urlencode({"slug": f"eq.{slug}", "updated_at": f"eq.{row['updated_at']}"})
        patch = urllib.request.Request(
            f"{url}/rest/v1/blog_posts?{query}",
            method="PATCH",
            data=json.dumps(fields).encode("utf-8"),
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
