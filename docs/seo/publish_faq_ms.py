# -*- coding: utf-8 -*-
"""Publish Malay FAQ fields, matched by page_key and sort_order.

Input is a JSON object keyed by sort_order. Each value carries question_ms and
answer_ms. Only rows whose sort_order and page_key match are written.

Usage:
  python docs/seo/publish_faq_ms.py tmp/ms-faq.json            # dry-run
  python docs/seo/publish_faq_ms.py tmp/ms-faq.json --publish
"""

import json
import os
import sys
import urllib.error
import urllib.request

PAGE_KEY = "general"


def main():
    if len(sys.argv) < 2:
        print("usage: publish_faq_ms.py <file.json> [--publish]")
        return 1
    source = sys.argv[1]
    publish = "--publish" in sys.argv

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (os.environ.get("SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    payload = json.load(open(source, encoding="utf-8"))

    req = urllib.request.Request(
        f"{url}/rest/v1/faqs?select=id,sort_order,question_en,question_ms,answer_ms"
        f"&page_key=eq.{PAGE_KEY}&order=sort_order",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        rows = json.loads(r.read().decode("utf-8", "ignore"))

    by_order = {str(row["sort_order"]): row for row in rows}
    print(f"{PAGE_KEY} rows: {len(rows)} | payload entries: {len(payload)}")

    unknown = [o for o in payload if o not in by_order]
    if unknown:
        print(f"sort_order not found: {unknown}")

    ok = failed = 0
    for order, fields in payload.items():
        row = by_order.get(order)
        if not row:
            failed += 1
            continue
        q, a = fields.get("question_ms", ""), fields.get("answer_ms", "")
        if not q or not a:
            print(f"  {order}: incomplete (q={len(q)} a={len(a)})")
            failed += 1
            continue
        print(f"  sort={order:<4} q {len(q):>2} chars | a {len(a):>3} chars | {(row.get('question_en') or '')[:52]}")
        if not publish:
            continue
        patch = urllib.request.Request(
            f"{url}/rest/v1/faqs?id=eq.{row['id']}",
            method="PATCH",
            data=json.dumps({"question_ms": q, "answer_ms": a}).encode("utf-8"),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(patch, timeout=30):
                ok += 1
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"    FAIL {e.code}")

    if publish:
        print(f"\ndone: ok={ok} failed={failed}")
    else:
        print("\ndry-run only. Re-run with --publish to write.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
