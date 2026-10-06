export type HomeFaqSchemaItem = { question: string; answer: string };
type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isFaqPageNode = (value: unknown) => isRecord(value)
  && (value["@type"] === "FAQPage" || (Array.isArray(value["@type"]) && value["@type"].includes("FAQPage")));

// A successful home refetch uses the same published list as the visible accordion.
export function syncHomeFaqStructuredData(
  schema: unknown,
  faqItems: readonly HomeFaqSchemaItem[],
  faqPageId: string,
): JsonRecord | null {
  if (!isRecord(schema) || !Array.isArray(schema["@graph"])) return null;
  const graph = schema["@graph"];
  const eligible = faqItems.filter(({ question, answer }) => question.trim() && answer.trim());
  const previous = graph.find(isFaqPageNode);
  const replacement = eligible.length ? {
    ...(isRecord(previous) ? previous : {}),
    "@type": "FAQPage",
    "@id": faqPageId,
    mainEntity: eligible.map(({ question, answer }) => ({
      "@type": "Question", name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  } : null;
  let replaced = false;
  const nextGraph = graph.flatMap((node) => {
    if (!isFaqPageNode(node)) return [node];
    if (replaced || !replacement) return [];
    replaced = true;
    return [replacement];
  });
  if (replacement && !replaced) nextGraph.push(replacement);
  return { ...schema, "@graph": nextGraph };
}
