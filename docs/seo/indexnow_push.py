# -*- coding: utf-8 -*-
"""Submit changed URLs to IndexNow (Bing, Yandex, Naver, Seznam).

IndexNow is an open protocol, not a trick: it tells participating engines that a URL
changed so they can recrawl sooner. Google does not participate.

Usage:
  python docs/seo/indexnow_push.py --articles              # the six new lock articles
  python docs/seo/indexnow_push.py --urls a b c            # explicit URLs
  python docs/seo/indexnow_push.py --articles --dry-run
"""

import argparse
import json
import sys
import urllib.error
import urllib.request

HOST = "flashcast.com.my"
KEY = "3fTLTbZhMHZEarEyyVF3NToA1hVGP7ev"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"

LOCK_ARTICLES = [
    "digital-lock-price-kl-selangor",
    "condo-door-digital-lock-check",
    "fingerprint-face-palm-vein-which",
    "aluminium-door-narrow-frame-lock",
    "tenant-changeover-digital-lock",
    "digital-lock-power-failure",
]

# Malay bodies are empty for these, so only the languages that carry content.
LANGUAGES = ("en", "zh")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--articles", action="store_true", help="submit the six lock articles in en and zh")
    parser.add_argument("--urls", nargs="*", default=[], help="explicit URLs to submit")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    urls = list(args.urls)
    if args.articles:
        urls += [f"https://{HOST}/{lang}/blog/{slug}" for slug in LOCK_ARTICLES for lang in LANGUAGES]

    urls = [u for u in dict.fromkeys(urls) if u.startswith(f"https://{HOST}/")]
    if not urls:
        print("nothing to submit")
        return 1

    print(f"{len(urls)} URLs")
    for u in urls:
        print("  " + u.replace(f"https://{HOST}", ""))

    payload = {"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": urls}
    if args.dry_run:
        print("\ndry run — not sent")
        return 0

    req = urllib.request.Request(
        ENDPOINT,
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "flashcast-indexnow/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            body = r.read().decode("utf-8", "ignore").strip()
            print(f"\nHTTP {r.status} {body[:200]}")
            if r.status in (200, 202):
                print("accepted — engines will recrawl on their own schedule")
                return 0
            return 1
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:300]
        print(f"\nHTTP {e.code}: {detail}")
        if e.code == 403:
            print("403 usually means the key file is unreachable or its content does not match the key")
        return 1


if __name__ == "__main__":
    sys.exit(main())
