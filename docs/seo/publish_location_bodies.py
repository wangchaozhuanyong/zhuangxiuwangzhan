# -*- coding: utf-8 -*-
"""Publish region page bodies into service_areas via PostgREST.

Mirrors docs/seo/publish-location-bodies.mjs, but uses urllib because Node's
fetch fails on this Windows checkout while urllib connects fine.

Usage:
  python docs/seo/publish_location_bodies.py            # dry-run
  python docs/seo/publish_location_bodies.py --publish  # write
  python docs/seo/publish_location_bodies.py --slug bangsar --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SOURCE_DIR = Path("docs/seo")
SOURCES = [
    "location-pages-batch-1.md",
    "location-pages-batch-2.md",
    "location-pages-batch-3.md",
    "location-pages-batch-4.md",
    "location-pages-final-10.md",
]

ALREADY_PUBLISHED = {
    "kuala-lumpur", "petaling-jaya", "subang-jaya", "mont-kiara",
    "puchong", "klang", "shah-alam", "cheras",
}

TITLES = {
    "kuala-lumpur": ("Kuala Lumpur", "吉隆坡"),
    "petaling-jaya": ("Petaling Jaya", "八打灵再也"),
    "subang-jaya": ("Subang Jaya", "梳邦再也"),
    "mont-kiara": ("Mont Kiara", "满家乐"),
    "puchong": ("Puchong", "蒲种"),
    "klang": ("Klang", "巴生"),
    "shah-alam": ("Shah Alam", "莎阿南"),
    "cheras": ("Cheras", "蕉赖"),
    "bangsar": ("Bangsar", "孟沙"),
    "bukit-jalil": ("Bukit Jalil", "武吉加里尔"),
    "setapak": ("Setapak", "文良港"),
    "kepong": ("Kepong", "甲洞"),
    "damansara": ("Damansara", "白沙罗"),
    "kota-damansara": ("Kota Damansara", "哥打白沙罗"),
    "ampang": ("Ampang", "安邦"),
    "sri-petaling": ("Sri Petaling", "大城堡"),
    "wangsa-maju": ("Wangsa Maju", "旺沙玛珠"),
    "seri-kembangan": ("Seri Kembangan", "沙登"),
    "kajang": ("Kajang", "加影"),
    "balakong": ("Balakong", "无拉港"),
    "ara-damansara": ("Ara Damansara", "阿拉白沙罗"),
    "rawang": ("Rawang", "万挠"),
    "setia-alam": ("Setia Alam", "实达阿南"),
    "sungai-buloh": ("Sungai Buloh", "双溪毛糯"),
    "cyberjaya": ("Cyberjaya", "赛城"),
    "putrajaya": ("Putrajaya", "布城"),
    "desa-parkcity": ("Desa ParkCity", "帝沙公园城"),
    "taman-tun-dr-ismail": ("Taman Tun Dr Ismail", "里端端"),
    "semenyih": ("Semenyih", "士毛月"),
    "selangor": ("Selangor", "雪兰莪"),
}


def parse_sources():
    pages = {}
    for name in SOURCES:
        path = SOURCE_DIR / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        blocks = re.split(r"^## `/locations/", text, flags=re.M)[1:]
        for block in blocks:
            cut = block.find("`")
            if cut <= 0:
                continue
            slug = block[:cut]
            htmls = re.findall(r"```html\r?\n(.*?)```", block, re.S)
            if len(htmls) < 2:
                continue
            pages[slug] = (htmls[0].strip(), htmls[1].strip())
    return pages


def strip_tags(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def excerpt(html, limit):
    return strip_tags(html.split("</p>")[0])[:limit]


def paragraphs(html):
    return [strip_tags(p) for p in html.split("</p>") if strip_tags(p)]


def build_record(slug, en_html, zh_html):
    en_name, zh_name = TITLES.get(slug, (slug, slug))
    p_en = paragraphs(en_html)
    p_zh = paragraphs(zh_html)
    return {
        "title_en": f"{en_name} Renovation Contractor",
        "title_zh": f"{zh_name}装修公司",
        "content_en": en_html,
        "content_zh": zh_html,
        "excerpt_en": excerpt(en_html, 180),
        "excerpt_zh": excerpt(zh_html, 70),
        "seo_description_en": excerpt(en_html, 155),
        "seo_description_zh": excerpt(zh_html, 70),
        "construction_notes_en": p_en[2] if len(p_en) > 2 else (p_en[1] if len(p_en) > 1 else ""),
        "construction_notes_zh": p_zh[2] if len(p_zh) > 2 else (p_zh[1] if len(p_zh) > 1 else ""),
    }


def main():
    publish = "--publish" in sys.argv
    slug_idx = sys.argv.index("--slug") if "--slug" in sys.argv else -1
    only = sys.argv[slug_idx + 1] if slug_idx >= 0 else None

    url = (os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY in the environment.")
        return 1

    pages = parse_sources()
    targets = [s for s in pages if (s == only if only else s not in ALREADY_PUBLISHED)]
    if not targets:
        print("Nothing to publish.")
        return 0

    print(f"mode: {'PUBLISH' if publish else 'dry-run'} | targets: {len(targets)}")
    ok = failed = 0
    log = []

    for slug in targets:
        en_html, zh_html = pages[slug]
        record = build_record(slug, en_html, zh_html)
        if not publish:
            log.append({"slug": slug, "content_en": len(record["content_en"]), "content_zh": len(record["content_zh"])})
            continue
        req = urllib.request.Request(
            f"{url}/rest/v1/service_areas?slug=eq.{slug}",
            method="PATCH",
            data=json.dumps(record).encode("utf-8"),
            headers={
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                rows = json.loads(r.read().decode("utf-8", "ignore") or "[]")
                written = len(rows[0].get("content_en") or "") if rows else len(record["content_en"])
                ok += 1
                print(f"OK   {slug:<22} {r.status} content_en={written}")
                log.append({"slug": slug, "action": "published", "content_en": written})
        except urllib.error.HTTPError as e:
            failed += 1
            body = e.read().decode("utf-8", "ignore")[:200]
            print(f"FAIL {slug:<22} {e.code} {body}")
            log.append({"slug": slug, "action": "failed", "status": e.code, "error": body})
        except Exception as e:
            failed += 1
            print(f"ERR  {slug:<22} {str(e)[:150]}")
            log.append({"slug": slug, "action": "error", "error": str(e)[:200]})

    if publish:
        from datetime import datetime
        out = SOURCE_DIR / f"publish-log-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        out.write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\ndone: ok={ok} failed={failed}  log={out}")
    else:
        lens = [e["content_en"] for e in log]
        print(f"dry-run: {len(targets)} parsed, content_en {min(lens)}-{max(lens)} chars")
        print("Re-run with --publish to write.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
