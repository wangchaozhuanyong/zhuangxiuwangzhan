# -*- coding: utf-8 -*-
"""Trim trailing boilerplate from SEO titles across the content tables.

Two rules, both pattern based:

1. Malay material titles end in ": kegunaan dan spesifikasi". Every material already
   has a specifications section, so the phrase adds nothing and costs 26 characters.
2. Titles still carrying the old registered name "FLASH CAST SDN. BHD." are shortened
   to "FLASH CAST". The registered name belongs in schema.org, not in a title tag.

Only rows where the rule actually applies are touched, and every write is keyed by id.

Usage:
  python docs/seo/trim_title_boilerplate.py            # dry-run
  python docs/seo/trim_title_boilerplate.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

# (table, language fields, regex to strip)
RULES = [
    ("materials", ("seo_title_ms",),
     "\\s*:\\s*kegunaan dan spesifikasi\\s*"),
    ("materials", ("seo_title_en", "seo_title_zh", "seo_title_ms"),
     "\\s*[|\uff5c]\\s*FLASH CAST\\s+SDN\\.\\s*BHD\\.\\s*$"),
    ("service_areas", ("seo_title_en", "seo_title_zh", "seo_title_ms"),
     "\\s*[|\uff5c]\\s*FLASH CAST\\s+SDN\\.\\s*BHD\\.\\s*$"),
    ("services", ("seo_title_en", "seo_title_zh", "seo_title_ms"),
     "\\s*[|\uff5c]\\s*FLASH CAST\\s+SDN\\.\\s*BHD\\.\\s*$"),
    ("blog_posts", ("seo_title_en", "seo_title_zh", "seo_title_ms"),
     "\\s*[|\uff5c]\\s*FLASH CAST\\s+SDN\\.\\s*BHD\\.\\s*$"),
    ("projects", ("seo_title_en", "seo_title_zh", "seo_title_ms"),
     "\\s*[|\uff5c]\\s*FLASH CAST\\s+SDN\\.\\s*BHD\\.\\s*$"),
]

BRAND_TAIL = " | FLASH CAST"


def width(text):
    return sum(2 if ord(ch) > 0x2E80 else 1 for ch in text)


def clean(value, pattern):
    if not value or not re.search(pattern, value):
        return None
    # Substitute a space, not "", so "Item: note | Brand" does not become "Item| Brand".
    out = re.sub(pattern, " ", value)
    out = re.sub(r"\s{2,}", " ", out).strip()
    out = re.sub("\\s+([|\uff5c])", r" \1", out)
    # A stripped brand suffix is re-added in the short form.
    if pattern.endswith("BHD\\.\\s*$") and "FLASH CAST" not in out:
        out = out + BRAND_TAIL
    return out if len(out) >= 8 and out != value else None


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    total_rows = total_fields = 0
    for table, fields, pattern in RULES:
        select = ",".join(("id", "slug") + fields)
        req = urllib.request.Request(
            f"{url}/rest/v1/{table}?select={select}",
            headers={"apikey": key, "Authorization": "Bearer " + key},
        )
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                rows = json.loads(r.read().decode("utf-8", "ignore"))
        except urllib.error.HTTPError as e:
            print(f"{table}: skip ({e.code})")
            continue

        plan = []
        for row in rows:
            updates = {}
            for field in fields:
                new = clean(row.get(field) or "", pattern)
                if new:
                    updates[field] = new
            if updates:
                plan.append((row["id"], row["slug"], updates))

        n_fields = sum(len(u) for _, _, u in plan)
        print(f"{table}: {len(rows)} rows | {len(plan)} to change | {n_fields} fields")
        for _, slug, updates in plan[:2]:
            for field, new in updates.items():
                print(f"  {slug:<30} {field}: {width(new):>3} {new[:64]}")
        total_rows += len(plan)
        total_fields += n_fields

        if not (publish and plan):
            continue
        ok = failed = 0
        for rid, slug, updates in plan:
            patch = urllib.request.Request(
                f"{url}/rest/v1/{table}?id=eq.{rid}",
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
                print(f"  FAIL {slug} {e.code}")
        print(f"  -> wrote {ok}, failed {failed}")

    print(f"\ntotal: {total_rows} rows, {total_fields} fields")
    if not publish:
        print("dry-run only. Re-run with --publish to write.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
