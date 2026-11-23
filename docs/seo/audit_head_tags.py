# -*- coding: utf-8 -*-
"""Audit canonical, hreflang and Open Graph tags across the sitemap.

A wrong canonical removes a page from the index; a broken hreflang set splits the
language cluster; a mismatched og:title wastes the share preview. None of this shows
up in a title-length audit.

Usage:
  python docs/seo/audit_head_tags.py
"""

import json
import re
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from html import unescape as html_unescape

SITEMAP = "https://flashcast.com.my/sitemap.xml"
SITE = "https://flashcast.com.my"
UA = {"User-Agent": "Mozilla/5.0 (compatible; flashcast-audit)"}


def fetch(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            html = r.read().decode("utf-8", "ignore")
        status = r.status
    except urllib.error.HTTPError as e:
        return {"url": url, "status": e.code}
    except Exception as e:
        return {"url": url, "status": -1, "error": str(e)[:60]}

    def meta(pattern):
        m = re.search(pattern, html, re.I | re.S)
        return html_unescape(m.group(1).strip()) if m else ""

    canonical = meta(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"')
    if not canonical:
        canonical = meta(r'<link[^>]+href="([^"]*)"[^>]+rel="canonical"')
    alternates = dict()
    for m in re.finditer(r'<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]*)"', html, re.I):
        alternates[m.group(1).lower()] = m.group(2)
    for m in re.finditer(r'<link[^>]+hreflang="([^"]+)"[^>]+rel="alternate"[^>]+href="([^"]*)"', html, re.I):
        alternates.setdefault(m.group(1).lower(), m.group(2))

    title = meta(r"<title[^>]*>(.*?)</title>")
    return {
        "url": url,
        "status": status,
        "canonical": canonical,
        "hreflang": alternates,
        "title": re.sub(r"&amp;", "&", title),
        "og_title": meta(r'<meta[^>]+property="og:title"[^>]+content="([^"]*)"'),
        "og_url": meta(r'<meta[^>]+property="og:url"[^>]+content="([^"]*)"'),
        "og_image": meta(r'<meta[^>]+property="og:image"[^>]+content="([^"]*)"'),
        "robots": meta(r'<meta[^>]+name="robots"[^>]+content="([^"]*)"'),
    }


def main():
    req = urllib.request.Request(SITEMAP, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        urls = re.findall(r"<loc>(.*?)</loc>", r.read().decode("utf-8", "ignore"))
    print(f"sitemap urls: {len(urls)}")

    with ThreadPoolExecutor(max_workers=10) as ex:
        rows = list(ex.map(fetch, urls))
    json.dump(rows, open("tmp/head-tags.json", "w", encoding="utf-8"), ensure_ascii=False)

    ok = [r for r in rows if r.get("status") == 200]
    print(f"fetched ok: {len(ok)}/{len(rows)}")

    normalise = lambda u: u.rstrip("/") if u and u != SITE else u

    missing_canonical = [r for r in ok if not r["canonical"]]
    self_canonical = [r for r in ok if r["canonical"] and normalise(r["canonical"]) == normalise(r["url"])]
    wrong_canonical = [r for r in ok if r["canonical"] and normalise(r["canonical"]) != normalise(r["url"])]

    print(f"\nmissing canonical: {len(missing_canonical)}")
    print(f"self canonical:    {len(self_canonical)}")
    print(f"canonical points elsewhere: {len(wrong_canonical)}")
    for r in wrong_canonical[:12]:
        print(f"  {r['url'].replace(SITE,'')}")
        print(f"    -> {r['canonical'].replace(SITE,'')}")

    # hreflang
    no_alt = [r for r in ok if not r["hreflang"]]
    print(f"\npages with no hreflang: {len(no_alt)}")
    for r in no_alt[:8]:
        print(f"  {r['url'].replace(SITE,'')}")

    alt_lang_sets = Counter(tuple(sorted(r["hreflang"])) for r in ok if r["hreflang"])
    print("hreflang sets:", alt_lang_sets.most_common(5))

    # reciprocal check: for each page, its en alternate should point back
    by_url = {normalise(r["url"]): r for r in ok}
    non_reciprocal = []
    for r in ok:
        for lang, target in r["hreflang"].items():
            t = by_url.get(normalise(target))
            if t is None:
                non_reciprocal.append((r["url"], lang, target, "target not in sitemap"))
            elif normalise(t["url"]) not in [normalise(v) for v in t["hreflang"].values()]:
                non_reciprocal.append((r["url"], lang, target, "target has no back-reference"))
    print(f"\nnon-reciprocal hreflang: {len(non_reciprocal)}")
    for a, lang, b, why in non_reciprocal[:10]:
        print(f"  {a.replace(SITE,'')} [{lang}] -> {b.replace(SITE,'')} : {why}")

    # og
    og_mismatch = [r for r in ok if r["og_title"] and r["og_title"] != r["title"]]
    no_og_title = [r for r in ok if not r["og_title"]]
    no_og_image = [r for r in ok if not r["og_image"]]
    og_url_mismatch = [r for r in ok if r["og_url"] and normalise(r["og_url"]) != normalise(r["url"])]
    print(f"\nog:title differs from title: {len(og_mismatch)}")
    for r in og_mismatch[:5]:
        print(f"  {r['url'].replace(SITE,'')}")
        print(f"     title: {r['title'][:70]}")
        print(f"     og   : {r['og_title'][:70]}")
    print(f"missing og:title: {len(no_og_title)}")
    print(f"missing og:image: {len(no_og_image)}")
    print(f"og:url differs from page url: {len(og_url_mismatch)}")
    for r in og_url_mismatch[:6]:
        print(f"  {r['url'].replace(SITE,'')} -> {r['og_url'].replace(SITE,'')}")


if __name__ == "__main__":
    main()
