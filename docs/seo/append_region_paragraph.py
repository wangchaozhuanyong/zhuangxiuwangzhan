# -*- coding: utf-8 -*-
"""Append a closing paragraph to published service area bodies.

Used to bring region pages that sit just under the thin threshold up to it, with
content specific to that area. Refuses if the target already mentions the inserted
heading, so the script is safe to re-run.

Usage:
  python docs/seo/append_region_paragraph.py tmp/region-additions.json            # dry-run
  python docs/seo/append_region_paragraph.py tmp/region-additions.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

FIELD = "content_zh"


def main():
    if len(sys.argv) < 2:
        print("usage: append_region_paragraph.py <additions.json> [--publish]")
        return 1
    source = Path(sys.argv[1])
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    additions = json.loads(source.read_text(encoding="utf-8"))
    ok = failed = 0

    for slug, block in additions.items():
        req = urllib.request.Request(
            f"{url}/rest/v1/service_areas?select=id,slug,updated_at,{FIELD}&slug=eq.{slug}",
            headers={"apikey": key, "Authorization": "Bearer " + key},
        )
        rows = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))
        if not rows:
            print(f"{slug}: NOT FOUND")
            failed += 1
            continue
        row = rows[0]
        current = row.get(FIELD) or ""

        heading = block.split("</p>")[0].replace("<p>", "").replace("<strong>", "").replace("</strong>", "")
        if heading and heading in current:
            print(f"{slug}: already contains the new section, skipping")
            continue

        updated = current.rstrip() + block
        print(f"{slug}: {len(current)} -> {len(updated)}")

        if not publish:
            continue

        query = urllib.parse.urlencode({"slug": f"eq.{slug}", "updated_at": f"eq.{row['updated_at']}"})
        patch = urllib.request.Request(
            f"{url}/rest/v1/service_areas?{query}",
            method="PATCH",
            data=json.dumps({FIELD: updated}).encode("utf-8"),
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
