# -*- coding: utf-8 -*-
"""Check that internal links resolve.

Crawls a sample of public pages, collects every internal href, and reports any target
that does not return 200. Catches broken links introduced by content edits.

Usage:
  python docs/seo/check_internal_links.py
"""

import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

SITE = "https://flashcast.com.my"
UA = {"User-Agent": "Mozilla/5.0 (compatible; flashcast-linkcheck)"}

# A spread across every template that carries internal navigation.
SEEDS = [
    "/en", "/zh", "/en/services", "/zh/services", "/en/projects", "/zh/projects",
    "/en/locations", "/zh/locations", "/en/materials", "/zh/materials",
    "/en/blog", "/zh/blog", "/en/faq", "/zh/faq", "/en/contact", "/zh/contact",
    "/en/services/renovation", "/zh/services/renovation",
    "/en/services/kitchen", "/zh/services/kitchen",
    "/en/locations/cheras", "/zh/locations/cheras",
    "/en/locations/kuala-lumpur/digital-lock", "/zh/locations/kuala-lumpur/digital-lock",
    "/en/blog/bathroom-leakage-renovation-malaysia",
    "/zh/blog/klang-valley-renovation-cost-2026",
    "/en/blog/renovation-materials-malaysia",
    "/en/materials/category/furniture", "/zh/materials/category/bathroom",
]


def get(url, timeout=25):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return -1, ""


def internal_hrefs(html):
    out = set()
    for m in re.finditer(r'href="(/[^"#?]*)"', html):
        path = m.group(1)
        if path.startswith("//"):
            continue
        if re.search(r"\.(?:css|js|png|jpe?g|webp|svg|ico|xml|txt|json|woff2?)$", path):
            continue
        out.add(path)
    return out


def main():
    found = {}
    for seed in SEEDS:
        status, html = get(SITE + seed)
        if status != 200:
            print(f"SEED FAIL {seed} -> {status}")
            continue
        for path in internal_hrefs(html):
            found.setdefault(path, set()).add(seed)

    # Paths without a language prefix go through the legacy redirect.
    targets = sorted(found)
    print(f"seeds: {len(SEEDS)} | distinct internal links: {len(targets)}")

    bad = []
    def check(path):
        status, _ = get(SITE + path, timeout=20)
        if status not in (200, 301, 302, 307, 308):
            return (path, status, sorted(found[path])[:2])
        return None

    with ThreadPoolExecutor(max_workers=10) as ex:
        for result in ex.map(check, targets):
            if result:
                bad.append(result)

    print(f"\nbroken internal links: {len(bad)}")
    for path, status, sources in bad[:25]:
        print(f"  {status} {path}")
        print(f"      found on: {', '.join(sources)}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
