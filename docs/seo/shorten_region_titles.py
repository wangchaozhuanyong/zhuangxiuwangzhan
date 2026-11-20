# -*- coding: utf-8 -*-
"""Trim region seo titles whose trailing keyword list pushes them past the SERP limit.

Titles end in either the brand or a service list. Brand endings are left alone (the
manifest does not append twice). Anything else after the last pipe is a keyword list.

Thresholds are per script, not one number for all three languages: a CJK glyph renders
about twice as wide as a Latin one, so a 35-character Chinese title fits while a
35-character English one has room to spare. Region titles are shortened only when the
rendered title (including the appended brand) would actually be cut off.

Usage:
  python docs/seo/shorten_region_titles.py            # dry-run
  python docs/seo/shorten_region_titles.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

BRAND = re.compile(r"\s*[|｜]\s*FLASH CAST\s*$", re.I)
SPLIT = re.compile(r"\s*[|｜]\s*")
BRAND_SUFFIX = " | FLASH CAST"

# Maximum rendered width before the SERP truncates. Width counts a CJK glyph as two
# Latin units, which is roughly how they lay out in pixels.
LIMIT = 60


def width(text):
    return sum(2 if ord(ch) > 0x2E80 else 1 for ch in text)


def trim(value):
    """Return the title without its trailing keyword list, or None to keep it.

    Every region carries dedicated service pages, so repeating the service list in the
    region title adds no coverage and only pushes the title toward truncation. The tail
    is dropped regardless of length, which also makes the thirty titles consistent.
    """
    if not value or BRAND.search(value):
        return None
    parts = SPLIT.split(value)
    if len(parts) < 2:
        return None
    head = parts[0].strip()
    if len(head) < 6 or head == value:
        return None
    return head


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    req = urllib.request.Request(
        f"{url}/rest/v1/service_areas?select=id,slug,seo_title_en,seo_title_zh,seo_title_ms&order=slug",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        rows = json.loads(r.read().decode("utf-8", "ignore"))

    plan = []
    for row in rows:
        updates = {}
        for lang in ("en", "zh", "ms"):
            field = f"seo_title_{lang}"
            new = trim(row.get(field) or "")
            if new:
                updates[field] = new
        if updates:
            plan.append((row["id"], row["slug"], updates))

    print(f"service_areas: {len(rows)} | rows to change: {len(plan)} | fields: {sum(len(u) for _, _, u in plan)}")
    for _, slug, updates in plan[:4]:
        for field, new in updates.items():
            rendered = len(new) + len(BRAND_SUFFIX)
            print(f"  {slug:<18} {field}: {len(new):>3} (rendered {rendered:>3}) -> {new}")

    if not publish:
        print("\ndry-run only. Re-run with --publish to write.")
        return 0

    ok = failed = 0
    for rid, slug, updates in plan:
        patch = urllib.request.Request(
            f"{url}/rest/v1/service_areas?id=eq.{rid}",
            method="PATCH",
            data=json.dumps(updates).encode("utf-8"),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(patch, timeout=30):
                ok += 1
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"FAIL {slug} {e.code}")
    print(f"\ndone: rows_ok={ok} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
