import { describe, expect, it } from "vitest";
import { syncHomeFaqStructuredData } from "./homeFaqSchemaSync";

const faqItems = [
  { question: "How do I request a renovation quote?", answer: "Updated quote terms: free measurement within 30 km; beyond that is chargeable." },
  { question: "Is after-sales support or warranty included?", answer: "A one-year warranty applies to confirmed work; details are in writing." },
];
const bilingualFaqItems = [
  {
    language: "en",
    canonical: "https://flashcast.com.my/en",
    items: faqItems,
  },
  {
    language: "zh",
    canonical: "https://flashcast.com.my/zh",
    items: [
      { question: "如何申请装修报价？", answer: "30 公里以内可免费量房；超过 30 公里收费，预约前确认金额。" },
      { question: "是否包含售后或保修？", answer: "已确认工程提供一年保修；范围与理赔流程以书面文件为准。" },
    ],
  },
];

describe("syncHomeFaqStructuredData", () => {
  it("updates the FAQPage answers from the visible list and preserves other graph nodes", () => {
    const business = { "@type": "HomeAndConstructionBusiness", name: "FLASH CAST" };
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        business,
        {
          "@type": "FAQPage",
          "@id": "https://flashcast.com.my/en#faq",
          mainEntity: [{ "@type": "Question", name: "Old", acceptedAnswer: { text: "Stale" } }],
        },
      ],
    };

    const next = syncHomeFaqStructuredData(schema, faqItems, "https://flashcast.com.my/en#faq");

    expect(next?.["@graph"]).toEqual([
      business,
      {
        "@type": "FAQPage",
        "@id": "https://flashcast.com.my/en#faq",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ]);
  });

  it("keeps quote and warranty answer text aligned for both supported languages", () => {
    for (const { language, canonical, items } of bilingualFaqItems) {
      const schema = { "@graph": [{ "@type": "FAQPage", mainEntity: [] }] };
      const next = syncHomeFaqStructuredData(schema, items, `${canonical}#faq`);
      const faqPage = (next?.["@graph"] as Array<Record<string, unknown>>).find((node) => node["@type"] === "FAQPage");
      const mainEntity = faqPage?.mainEntity as Array<{ acceptedAnswer: { text: string } }>;

      expect(mainEntity.map((item) => item.acceptedAnswer.text), language).toEqual(items.map((item) => item.answer));
    }
  });

  it("adds one FAQPage when missing and removes duplicate FAQPage nodes", () => {
    const schema = {
      "@graph": [
        { "@type": "HomeAndConstructionBusiness" },
        { "@type": "FAQPage", mainEntity: [] },
        { "@type": ["FAQPage"], mainEntity: [] },
      ],
    };
    const next = syncHomeFaqStructuredData(schema, faqItems, "https://flashcast.com.my/zh#faq");

    expect((next?.["@graph"] as unknown[]).filter((node) =>
      typeof node === "object" && node !== null && (node as Record<string, unknown>)["@type"] === "FAQPage",
    )).toHaveLength(1);
  });

  it("removes the FAQPage when the published FAQ list is empty", () => {
    const schema = { "@graph": [{ "@type": "FAQPage", mainEntity: [] }, { "@type": "Organization" }] };
    const next = syncHomeFaqStructuredData(schema, [], "https://flashcast.com.my/en#faq");
    expect(next?.["@graph"]).toEqual([{ "@type": "Organization" }]);
  });

  it("leaves unsupported structured-data shapes untouched", () => {
    expect(syncHomeFaqStructuredData({ "@type": "FAQPage" }, faqItems, "https://flashcast.com.my/en#faq")).toBeNull();
  });
});
