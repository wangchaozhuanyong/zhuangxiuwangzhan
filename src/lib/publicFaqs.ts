import { faqPageText } from "../i18n/faqPageText";
import type { Language } from "../i18n/languageDetection";
import { localizedContentValue } from "../i18n/localizedContentValue";
import { toText } from "./recordUtils";

type FaqAnswer = { question: string; answer: string };
type FaqPageCategory = { category: string; items: readonly { q: string; a: string }[] };

export function mapPublishedFaqRow(row: Record<string, unknown>, language: Language) {
  return {
    id: toText(row.id),
    category: toText(row.page_key, "general"),
    question: toText(localizedContentValue(row, "question", language, "")),
    answer: toText(localizedContentValue(row, "answer", language, "")),
  };
}

export function resolveFaqPageCategories(
  language: Language, general: readonly FaqAnswer[] = [], home: readonly FaqAnswer[] = [],
): readonly FaqPageCategory[] {
  if (!general.length && !home.length) return faqPageText[language].categories;
  const seen = new Set<string>();
  const items = [];
  for (const { question, answer } of [...general, ...home]) {
    if (seen.has(question)) continue;
    seen.add(question);
    items.push({ q: question, a: answer });
  }
  return [{ category: faqPageText[language].categories[0].category, items }];
}

export function faqPageQuestions(categories: readonly FaqPageCategory[]): FaqAnswer[] {
  return categories.flatMap(({ items }) => items.map(({ q, a }) => ({ question: q, answer: a })));
}
