# -*- coding: utf-8 -*-
"""Publish Malay service fields from a local JSON file.

Each key is a service slug; each value maps a field to its Malay translation. Only the
fields present in the file are written, so a partial translation cannot wipe English.

Usage:
  python docs/seo/publish_service_ms.py tmp/ms-digital-lock.json            # dry-run
  python docs/seo/publish_service_ms.py tmp/ms-digital-lock.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.request

REQUIRED = ("title_ms", "seo_title_ms", "seo_description_ms", "content_ms")


def main():
    if len(sys.argv) < 2:
        print("usage: publish_service_ms.py <file.json> [--publish]")
        return 1
    source = sys.argv[1]
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    payload = json.load(open(source, encoding="utf-8"))

    # Fetch each row's populated English fields so we can report gaps.
    ok = failed = 0
    for slug, fields in payload.items():
        req = urllib.request.Request(
            f"{url}/rest/v1/services?select=*&slug=eq.{slug}",
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

        en_fields = [k[:-3] for k in row if k.endswith("_en") and row.get(k)]
        missing = [f for f in en_fields if f + "_ms" not in fields]
        if missing:
            print(f"{slug}: MISSING ms for {missing}")

        absent = [f for f in REQUIRED if f not in fields]
        if absent:
            print(f"{slug}: missing required {absent}")
            failed += 1
            continue

        print(f"{slug}: {len(fields)} fields ready | content_ms {len(fields['content_ms'])} chars | en counterparts {len(en_fields)}")
        if not publish:
            continue

        patch = urllib.request.Request(
            f"{url}/rest/v1/services?slug=eq.{slug}",
            method="PATCH",
            data=json.dumps(fields).encode("utf-8"),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(patch, timeout=30):
                ok += 1
                print(f"  -> written")
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
