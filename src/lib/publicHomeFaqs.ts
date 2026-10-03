type PublicHomeFaq = { id: string; category: string; question: string; answer: string };
const text = (value: unknown) => typeof value === "string" ? value : "";

// Published home RPC/preload is the authority in both browser and edge.
// Missing locale answers are omitted, not replaced with static/other-language claims.
export function mapPublicHomeFaqs(value: unknown, language: "en" | "zh"): PublicHomeFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const row = value as Record<string, unknown>;
    if (row.deleted_at || (row.status && row.status !== "published") || (row.page_key && row.page_key !== "home")) return [];
    const question = text(row[`question_${language}`]);
    const answer = text(row[`answer_${language}`]);
    return question.trim() && answer.trim()
      ? [{ id: text(row.id), category: "home", question, answer }]
      : [];
  });
}
