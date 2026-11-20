# -*- coding: utf-8 -*-
"""Drop the "Specifications and Quotation Guide" phrase from material SEO titles.

It adds 33 characters without adding a search term the page does not already cover in
its body, and it pushed most titles past the display limit.

Usage:
  python docs/seo/shorten_material_titles.py            # dry-run
  python docs/seo/shorten_material_titles.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

PHRASES = {
    "seo_title_en": r"\s*\bSpecifications and Quotation Guide\b\s*",
    "seo_title_zh": "\\s*\u89c4\u683c\u4e0e\u62a5\u4ef7\u6307\u5357\\s*",
}
BRAND = re.compile("\\s*[|\uff5c]\\s*FLASH CAST\\s*$", re.I)


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    req = urllib.request.Request(
        f"{url}/rest/v1/materials?select=id,slug,seo_title_en,seo_title_zh",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        rows = json.loads(r.read().decode("utf-8", "ignore"))

    plan = []
    for row in rows:
        updates = {}
        for field, pattern in PHRASES.items():
            value = row.get(field) or ""
            if not value or not re.search(pattern, value):
                continue
            cleaned = re.sub(pattern, " ", value)
            cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
            cleaned = re.sub("\\s+([|\uff5c])", r" \1", cleaned)
            cleaned = re.sub("([|\uff5c])\\s+", r"\1 ", cleaned)
            if len(cleaned) >= 10 and cleaned != value:
                updates[field] = cleaned
        if updates:
            plan.append((row["id"], row["slug"], updates))

    print(f"materials rows: {len(rows)} | rows to change: {len(plan)} | fields: {sum(len(u) for _, _, u in plan)}")
    for _, slug, updates in plan[:4]:
        for field, new in updates.items():
            print(f"  {slug:<28} {len(new):>3} -> {new}")

    if not publish:
        print("\ndry-run only. Re-run with --publish to write.")
        return 0

    ok = failed = 0
    for rid, slug, updates in plan:
        patch = urllib.request.Request(
            f"{url}/rest/v1/materials?id=eq.{rid}",
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
