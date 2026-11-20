# -*- coding: utf-8 -*-
"""Audit every sitemap URL for title/description/schema problems.

Run from the repository root:

    python docs/seo/seo_audit.py

Writes tmp/seo-audit.json and prints a summary. Title length is measured in display
width, counting a CJK glyph as two Latin units, because that is closer to how the SERP
lays out pixels than a raw character count.
"""

import json
import re
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

SITEMAP = "https://flashcast.com.my/sitemap.xml"
SITE = "https://flashcast.com.my"
LIMIT = 60


def width(text):
    return sum(2 if ord(ch) > 0x2E80 else 1 for ch in text)


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; flashcast-audit)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            html = r.read().decode("utf-8", "ignore")
        title = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
        desc = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', html)
        robots = re.search(r'<meta[^>]+name="robots"[^>]+content="([^"]*)"', html)
        body = re.sub(r"<script.*?</script>|<style.*?</style>", "", html, flags=re.S)
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()
        return {
            "url": url,
            "status": r.status,
            "title": re.sub(r"&amp;", "&", title.group(1).strip()) if title else "",
            "description": desc.group(1).strip() if desc else "",
            "robots": robots.group(1).strip() if robots else "",
            "textLen": len(text),
        }
    except urllib.error.HTTPError as e:
        return {"url": url, "status": e.code}
    except Exception as e:
        return {"url": url, "status": -1, "error": str(e)[:80]}


def section(url):
    parts = [p for p in url.replace(SITE, "").split("/") if p]
    return parts[1] if len(parts) > 1 else "home"


def main():
    with urllib.request.urlopen(SITEMAP, timeout=40) as r:
        urls = re.findall(r"<loc>(.*?)</loc>", r.read().decode("utf-8", "ignore"))
    print(f"sitemap urls: {len(urls)}")

    with ThreadPoolExecutor(max_workers=10) as ex:
        rows = list(ex.map(fetch, urls))
    json.dump(rows, open("tmp/seo-audit.json", "w", encoding="utf-8"), ensure_ascii=False)

    ok = [r for r in rows if r.get("status") == 200]
    print(f"fetched ok: {len(ok)}/{len(rows)}")

    by_title = defaultdict(list)
    for r in ok:
        if r["title"]:
            by_title[r["title"]].append(r["url"])
    dup = {t: u for t, u in by_title.items() if len(u) > 1}
    print(f"\nduplicate titles: {len(dup)} groups")
    for t, u in list(dup.items())[:5]:
        print(f"  [{len(u)}x] {t[:70]}")

    long_titles = [r for r in ok if width(r["title"]) > LIMIT]
    print(f"\ntitles over {LIMIT} width: {len(long_titles)}")
    print("by section:", Counter(section(r["url"]) for r in long_titles).most_common())

    long_desc = [r for r in ok if len(r["description"]) > 160]
    short_desc = [r for r in ok if r["description"] and len(r["description"]) < 50]
    print(f"descriptions over 160: {len(long_desc)}")
    print(f"descriptions under 50: {len(short_desc)}")
    print(f"missing title: {sum(1 for r in ok if not r['title'])}")
    print(f"missing description: {sum(1 for r in ok if not r['description'])}")
    print(f"noindex in sitemap: {sum(1 for r in ok if 'noindex' in r['robots'])}")
    thin = [r for r in ok if r["textLen"] < 800]
    print(f"thin pages under 800 chars: {len(thin)}")
    for r in sorted(thin, key=lambda x: x["textLen"])[:8]:
        print(f"  {r['textLen']:>5} {r['url'].replace(SITE, '')[:65]}")


if __name__ == "__main__":
    main()
