import { describe, expect, it } from "vitest";
import { mapPublicHomeFaqs } from "./publicHomeFaqs";
import { buildReadableHomeFaqBody } from "../../functions/readablePublicBody";

describe("published home FAQ authority", () => {
  it("uses changed CMS answers, including quote distance and warranty, in each language", () => {
    const rows = [{ id: "quote", page_key: "home", question_en: "Quote?", answer_en: "Free within 30 km; beyond is chargeable.", question_zh: "量房？", answer_zh: "30 公里以内免费，超过收费。" }, { id: "warranty", question_en: "Warranty?", answer_en: "One year; coverage in writing.", question_zh: "保修？", answer_zh: "一年；范围书面确认。" }];
    expect(mapPublicHomeFaqs(rows, "en").map(x => x.answer)).toEqual(rows.map(x => x.answer_en));
    expect(mapPublicHomeFaqs(rows, "zh").map(x => x.answer)).toEqual(rows.map(x => x.answer_zh));
    rows[0].answer_en = "Updated approved quote conditions.";
    expect(mapPublicHomeFaqs(rows, "en")[0].answer).toBe(rows[0].answer_en);
  });
  it("does not revive missing locale, withdrawn, deleted or another page's answer", () => {
    const row = { question_en: "Question", answer_en: "Answer", question_zh: "问题" };
    expect(mapPublicHomeFaqs([row], "zh")).toEqual([]);
    expect(mapPublicHomeFaqs([{ ...row, status: "draft" }, { ...row, deleted_at: "2026-10-03" }, { ...row, page_key: "general" }], "en")).toEqual([]);
    expect(mapPublicHomeFaqs(null, "en")).toEqual([]);
  });
  it("renders exact source as safely escaped no-JS text, only on home", () => {
    const items = [{ question: 'Q <script>"?', answer: "A <img onerror=x> & terms" }];
    const body = buildReadableHomeFaqBody("/en", items);
    expect(body).toContain("Q &lt;script&gt;&quot;?");
    expect(body).toContain("A &lt;img onerror=x&gt; &amp; terms");
    expect(body).not.toContain("<script>");
    expect(buildReadableHomeFaqBody("/en/services", items)).toBe("");
    expect(buildReadableHomeFaqBody("/zh", [])).toBe("");
  });
});
