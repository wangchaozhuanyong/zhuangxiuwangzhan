import { malayText } from "@/i18n/malayText";
type Language = "en" | "zh" | "ms";

export type WarehouseIntroLink = {
  paragraphIndex: number;
  before: string;
  anchor: string;
  after: string;
  to: "/services/warehouse";
};

// Link only the existing CMS phrase within the confirmed, limited scope.
export function findSelangorWarehouseIntroLink(
  paragraphs: readonly string[],
  slug: string | undefined,
  language: Language,
): WarehouseIntroLink | null {
  if (slug !== "selangor") return null;

  const anchor = language === "ms" ? malayText("warehouse-related needs") : (language === "zh" ? "仓储相关服务" : "warehouse-related needs");
  const scope = language === "ms" ? malayText("warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning") : (language === "zh"
    ? "仓储相关服务仅限货架、通道规划、地面标线及存储分区"
    : "warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning");
  const matching = paragraphs.flatMap((paragraph, paragraphIndex) => {
    const at = paragraph.indexOf(anchor);
    if (!paragraph.includes(scope) || at < 0 || paragraph.indexOf(anchor, at + anchor.length) !== -1) return [];
    return [{ paragraphIndex, before: paragraph.slice(0, at), anchor, after: paragraph.slice(at + anchor.length), to: "/services/warehouse" as const }];
  });

  return matching.length === 1 ? matching[0] : null;
}
