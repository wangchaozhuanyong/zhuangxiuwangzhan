import type { LandingProject } from "@/data/landings";
import type { Language } from "@/i18n/languageDetection";

const protectedLandingSlugs = new Set(["office-renovation"]);

const allowedBroadLocations = new Set([
  "kuala lumpur",
  "selangor",
  "klang valley",
  "kuala lumpur / selangor",
  "kuala lumpur & selangor",
  "吉隆坡",
  "雪兰莪",
  "巴生谷",
  "吉隆坡 / 雪兰莪",
  "吉隆坡与雪兰莪",
  "吉隆坡及雪兰莪",
]);

const allowedTitles: Record<string, Set<string>> = {
  "office-renovation": new Set([
    "Office Space Planning Reference",
    "Office Refurbishment Reference",
    "Commercial Fit-Out Reference",
    "Office Renovation",
    "办公空间布局规划参考",
    "办公空间改造与协作区参考",
    "商业空间装修参考",
    "办公室装修",
  ]),
};

const titleCopy: Record<string, Record<Language, string[]>> = {
  "office-renovation": {
    en: ["Office Space Planning Reference", "Office Refurbishment Reference"],
    zh: ["办公空间布局规划参考", "办公空间改造与协作区参考"],
  },
};

const selangorHints =
  /\b(?:petaling jaya|pj|shah alam|subang|puchong|kajang|klang|cyberjaya|rawang|setia alam)\b|八打灵再也|沙亚南|梳邦|蒲种|加影|巴生|赛城|雪兰莪/i;
const kualaLumpurHints =
  /\b(?:kuala lumpur|kl|kl sentral|bangsar|mont kiara|kepong|sri petaling)\b|吉隆坡|吉隆坡中环|孟沙|满家乐|甲洞|大城堡/i;

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const broadLocation = (value: string, language: Language) => {
  if (selangorHints.test(value)) return language === "zh" ? "雪兰莪" : "Selangor";
  if (kualaLumpurHints.test(value)) return language === "zh" ? "吉隆坡" : "Kuala Lumpur";
  return language === "zh" ? "巴生谷" : "Klang Valley";
};

export const isPrivacyProtectedLanding = (slug?: string) => Boolean(slug && protectedLandingSlugs.has(slug));

export const anonymizeLandingProjectCards = (
  slug: string | undefined,
  language: Language,
  projects: LandingProject[],
): LandingProject[] => {
  if (!slug || !isPrivacyProtectedLanding(slug)) return projects;

  const safeTitles = titleCopy[slug][language];
  return projects.map((project, index) => ({
    ...project,
    title: safeTitles[index % safeTitles.length],
    location: broadLocation(project.location, language),
  }));
};

export const getLandingProjectPrivacyIssues = (slug: unknown, projects: unknown) => {
  const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
  if (!isPrivacyProtectedLanding(normalizedSlug) || !Array.isArray(projects)) return [];

  const approvedTitles = allowedTitles[normalizedSlug];
  const issues: string[] = [];

  projects.forEach((value, index) => {
    const project = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const title = typeof project.title === "string" ? project.title.trim() : "";
    const location = typeof project.location === "string" ? project.location.trim() : "";

    if (!approvedTitles.has(title)) issues.push(`related_projects[${index}].title`);
    if (!allowedBroadLocations.has(normalize(location))) issues.push(`related_projects[${index}].location`);
  });

  return issues;
};
