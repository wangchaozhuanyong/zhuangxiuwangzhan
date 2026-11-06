import { stripHtml } from "./text";

export type PublicServiceFaq = { question: string; answer: string };

// Browser-visible answers and edge FAQ schema use the same plain-text projection.
// An available published row with an empty/malformed locale does not borrow another language.
export function mapPublicServiceFaqs(value: unknown): PublicServiceFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const text = (value: unknown) => typeof value === "string" ? stripHtml(value) : "";
    const question = text(row.q) || text(row.question);
    const answer = text(row.a) || text(row.answer);
    return question && answer ? [{ question, answer }] : [];
  });
}

export function mapOldHousePublicFaqs(value: unknown): PublicServiceFaq[] {
  return mapPublicServiceFaqs(value).map((faq) =>
    faq.question === "What counts as before-and-after evidence for an old-house renovation?"
      ? {
          ...faq,
          answer: faq.answer.replace(
            "The before-and-proposed visuals on this page are labelled as AI-generated planning concepts; they should not be read as a client project or construction result.",
            "The comparison on this page shows an illustrated starting layout and a proposed design rendering.",
          ),
        }
      : faq,
  );
}
