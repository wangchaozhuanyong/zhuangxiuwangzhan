# -*- coding: utf-8 -*-
"""Publish the Selangor state page with the warehouse scope sentence included.

readablePublicBody only emits the Selangor body when one paragraph contains the exact
scope phrase from selangorWarehouseIntroLink.ts. The generic body lacks it, so the
no-JS shell renders empty. This injects the sentence once, in the industrial paragraph.

Usage:
  python docs/seo/publish_selangor_body.py            # dry-run
  python docs/seo/publish_selangor_body.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SOURCE = Path("docs/seo/location-pages-final-10.md")

EN_SCOPE = "warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning"
ZH_SCOPE = "仓储相关服务仅限货架、通道规划、地面标线及存储分区"

EN_SENTENCE = f"For {EN_SCOPE}."
ZH_SENTENCE = f"{ZH_SCOPE}。"


def extract_selangor():
    text = SOURCE.read_text(encoding="utf-8")
    block = re.split(r"^## `/locations/selangor`", text, flags=re.M)
    if len(block) < 2:
        raise SystemExit("selangor section not found")
    body = block[1]
    htmls = re.findall(r"```html\r?\n(.*?)```", body, re.S)
    if len(htmls) < 2:
        raise SystemExit("selangor html blocks not found")
    return htmls[0].strip(), htmls[1].strip()


def inject(en_html, zh_html):
    # Append the sentence inside the industrial paragraph, before its closing tag.
    paragraphs_en = en_html.split("</p>")
    target_en = next(i for i, p in enumerate(paragraphs_en) if "industrial stock" in p)
    paragraphs_en[target_en] = paragraphs_en[target_en].rstrip() + " " + EN_SENTENCE
    en_out = "</p>".join(paragraphs_en)

    paragraphs_zh = zh_html.split("</p>")
    target_zh = next(i for i, p in enumerate(paragraphs_zh) if "工业存量" in p)
    paragraphs_zh[target_zh] = paragraphs_zh[target_zh].rstrip() + ZH_SENTENCE
    zh_out = "</p>".join(paragraphs_zh)
    return en_out, zh_out


def check(en_html, zh_html):
    def plain(h):
        return [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", p)).strip() for p in h.split("</p>")]

    problems = []
    for html, scope, anchor in ((en_html, EN_SCOPE, "warehouse-related needs"),
                                (zh_html, ZH_SCOPE, "仓储相关服务")):
        hits = [p for p in plain(html) if scope in p]
        if len(hits) != 1:
            problems.append(f"scope paragraphs = {len(hits)} (need exactly 1)")
            continue
        at = hits[0].find(anchor)
        if hits[0].find(anchor, at + len(anchor)) != -1:
            problems.append("anchor appears more than once in its paragraph")
    return problems


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    en_html, zh_html = extract_selangor()
    en_out, zh_out = inject(en_html, zh_html)
    problems = check(en_out, zh_out)
    print(f"en {len(en_out)} chars | zh {len(zh_out)} chars")
    if problems:
        print("PRECHECK FAILED:")
        for p in problems:
            print("  -", p)
        return 1
    print("precheck passed: exactly one paragraph carries the scope phrase each language")

    if not publish:
        print("\ndry-run only. Re-run with --publish to write.")
        return 0

    record = {
        "content_en": en_out,
        "content_zh": zh_out,
        "excerpt_en": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", en_out.split("</p>")[0])).strip()[:180],
        "excerpt_zh": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", zh_out.split("</p>")[0])).strip()[:70],
    }
    req = urllib.request.Request(
        f"{url}/rest/v1/service_areas?slug=eq.selangor",
        method="PATCH",
        data=json.dumps(record).encode("utf-8"),
        headers={"apikey": key, "Authorization": "Bearer " + key,
                 "Content-Type": "application/json", "Prefer": "return=representation"},
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            rows = json.loads(r.read().decode("utf-8", "ignore") or "[]")
            print(f"published: {r.status} content_en={len(rows[0].get('content_en') or '') if rows else '?'}")
    except urllib.error.HTTPError as e:
        print("FAIL", e.code, e.read().decode("utf-8", "ignore")[:200])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
