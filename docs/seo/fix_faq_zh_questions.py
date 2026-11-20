# -*- coding: utf-8 -*-
"""Backfill question_zh on the FAQ rows that were inserted without it.

Matches on question_en, patches only question_zh. Idempotent.

Usage:
  python docs/seo/fix_faq_zh_questions.py            # dry-run
  python docs/seo/fix_faq_zh_questions.py --publish
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

QUESTIONS_ZH = {
    "What is included in the quotation, and what is not?": "报价包含什么、不包含什么？",
    "Why does the quotation contain provisional items?": "报价里为什么会有暂定项目？",
    "Can you quote from drawings or photos without a site visit?": "只有图纸或照片、不现场勘测，可以报价吗？",
    "How long does it take from enquiry to start?": "从咨询到开工通常要多久？",
    "How are payments structured?": "付款是怎么安排的？",
    "Do you require a deposit?": "需要付定金吗？",
    "Are there costs I should expect beyond the quotation?": "报价之外还会产生哪些费用？",
    "How long does a renovation take?": "装修工程要多久？",
    "What causes delays?": "什么情况会导致工期延误？",
    "Can we live in the unit during the renovation?": "装修期间可以继续住吗？",
    "Can work be done at night or on weekends?": "可以夜间或周末施工吗？",
    "Who pays the management deposit?": "管理处押金由谁支付？",
    "Do you handle local authority submissions?": "政府送审由你们负责吗？",
    "Can I remove a structural wall?": "可以拆掉结构墙吗？",
    "Do you provide warranty?": "提供保修吗？",
    "What is not covered by warranty?": "保修不包含哪些情况？",
    "Who do I contact if something goes wrong after handover?": "交付之后出问题该联系谁？",
    "Can I supply my own materials?": "材料可以自己采购吗？",
    "Can I see samples before deciding?": "决定之前可以看样板吗？",
    "Can I specify a particular brand?": "可以指定品牌吗？",
    "Do you work with my existing furniture or fittings?": "可以保留现有的家具或固定件吗？",
    "What types of work do you take on?": "你们承接哪些类型的工程？",
}


def main():
    publish = "--publish" in sys.argv
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SERVICE_ROLE_KEY")
    if not url or not key:
        print("Need SUPABASE_URL and SERVICE_ROLE_KEY.")
        return 1

    req = urllib.request.Request(
        f"{url}/rest/v1/faqs?select=id,question_en,question_zh&page_key=eq.general&order=sort_order",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read().decode("utf-8", "ignore"))

    # Stored questions were stripped of trailing punctuation at insert time.
    by_norm = {re.sub(r"[\s?？]+$", "", k).strip(): v for k, v in QUESTIONS_ZH.items()}
    pending = [(row, by_norm[re.sub(r"[\s?？]+$", "", row["question_en"]).strip()])
               for row in rows
               if re.sub(r"[\s?？]+$", "", row.get("question_en") or "").strip() in by_norm
               and not row.get("question_zh")]
    print(f"general rows: {len(rows)} | need question_zh: {len(pending)}")

    if not publish:
        for row, zh in pending[:5]:
            print(f"  {row['question_en'][:55]}")
            print(f"    -> {zh}")
        print("\ndry-run only. Re-run with --publish to patch.")
        return 0

    ok = failed = 0
    for row, zh in pending:
        patch = urllib.request.Request(
            f"{url}/rest/v1/faqs?id=eq.{row['id']}",
            method="PATCH",
            data=json.dumps({"question_zh": zh}).encode("utf-8"),
            headers={
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(patch, timeout=30) as r:
                ok += 1
                print(f"OK   {r.status} {zh}")
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"FAIL {e.code} {e.read().decode('utf-8','ignore')[:120]}")
    print(f"\ndone: ok={ok} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
