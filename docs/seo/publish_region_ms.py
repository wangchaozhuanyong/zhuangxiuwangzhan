# -*- coding: utf-8 -*-
"""Publish Malay region copy into service_areas.

The input is a JSON object keyed by region slug. Each value may carry content_ms,
excerpt_ms or both; only the keys present are written.

Usage:
  python docs/seo/publish_region_ms.py tmp/ms-loc-1.json            # dry-run
  python docs/seo/publish_region_ms.py tmp/ms-loc-1.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.request

ALLOWED = ("content_ms", "excerpt_ms", "seo_description_ms", "title_ms")


def main():
    if len(sys.argv) < 2:
        print("usage: publish_region_ms.py <file.json> [--publish]")
        return 1
    source = sys.argv[1]
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    payload = json.load(open(source, encoding="utf-8"))
    ok = failed = 0

    for slug, fields in payload.items():
        bad = [f for f in fields if f not in ALLOWED]
        if bad:
            print(f"{slug}: refuses unknown fields {bad}")
            failed += 1
            continue
        if not fields:
            print(f"{slug}: nothing to write")
            continue

        req = urllib.request.Request(
            f"{url}/rest/v1/service_areas?select=slug,content_en,content_ms&slug=eq.{slug}",
            headers={"apikey": key, "Authorization": "Bearer " + key},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                rows = json.loads(r.read().decode("utf-8", "ignore"))
        except urllib.error.HTTPError as e:
            print(f"{slug}: read failed {e.code}")
            failed += 1
            continue
        if not rows:
            print(f"{slug}: not found")
            failed += 1
            continue

        row = rows[0]
        body = fields.get("content_ms", "")
        print(f"{slug:<20} content_ms {len(body):>5} chars | en {len(row.get('content_en') or ''):>5} | ms before {len(row.get('content_ms') or ''):>5}")

        if not publish:
            continue

        patch = urllib.request.Request(
            f"{url}/rest/v1/service_areas?slug=eq.{slug}",
            method="PATCH",
            data=json.dumps(fields).encode("utf-8"),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(patch, timeout=30):
                ok += 1
                print("  -> written")
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"  -> FAIL {e.code} {e.read().decode('utf-8','ignore')[:140]}")

    if publish:
        print(f"\ndone: ok={ok} failed={failed}")
    else:
        print("\ndry-run only. Re-run with --publish to write.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
