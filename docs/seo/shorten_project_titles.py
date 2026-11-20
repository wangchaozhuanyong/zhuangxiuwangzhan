# -*- coding: utf-8 -*-
"""Shorten the project title suffix from "Renovation Project" to the brand alone.

Product and project URLs already say /projects/, so the words "Renovation Project" add
nothing and cost 17 characters. Only titles carrying that exact suffix are touched.

Usage:
  python docs/seo/shorten_project_titles.py            # dry-run
  python docs/seo/shorten_project_titles.py --publish
"""

import json
import os
import sys
import urllib.error
import urllib.request

REPLACEMENTS = [
    (" | FLASH CAST Renovation Project", " | FLASH CAST"),
    (" | Projek Pengubahsuaian FLASH CAST", " | FLASH CAST"),
    ("｜FLASH CAST Renovation Project", " | FLASH CAST"),
]


def width(text):
    return sum(2 if ord(ch) > 0x2E80 else 1 for ch in text)


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    req = urllib.request.Request(
        f"{url}/rest/v1/projects?select=id,slug,seo_title_en,seo_title_zh,seo_title_ms&order=slug",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        rows = json.loads(r.read().decode("utf-8", "ignore"))

    plan = []
    for row in rows:
        updates = {}
        for lang in ("en", "zh", "ms"):
            field = f"seo_title_{lang}"
            value = row.get(field) or ""
            for old, new in REPLACEMENTS:
                if value.endswith(old):
                    candidate = value[: -len(old)] + new
                    if len(candidate) >= 10:
                        updates[field] = candidate
                    break
        if updates:
            plan.append((row["id"], row["slug"], updates))

    before = sum(1 for r in rows for lang in ("en", "zh", "ms")
                 if r.get(f"seo_title_{lang}") and width(r[f"seo_title_{lang}"]) > 60)
    after = before
    for _, _, updates in plan:
        pass
    print(f"projects: {len(rows)} | rows to change: {len(plan)}")
    for _, slug, updates in plan[:5]:
        for field, new in updates.items():
            print(f"  {slug:<34} {field}: {width(new):>3} -> {new[:70]}")

    if not publish:
        print("\ndry-run only. Re-run with --publish to write.")
        return 0

    ok = failed = 0
    for rid, slug, updates in plan:
        patch = urllib.request.Request(
            f"{url}/rest/v1/projects?id=eq.{rid}",
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
