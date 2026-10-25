type BrandSettings = {
  company_name?: string | null;
  brand_name?: string | null;
};

export const PRIMARY_CHINESE_BRAND_NAME = "闪铸装饰";
export const CHINESE_BRAND_NAMES = [PRIMARY_CHINESE_BRAND_NAME, "闪铸设计", "闪铸装修"] as const;

const DEFAULT_COMPANY_NAME = "FLASH CAST SDN. BHD.";
const DEFAULT_BRAND_NAME = "FLASH CAST";
const chineseBrandAssociation = "闪铸装饰（FLASH CAST SDN. BHD.）亦称“闪铸设计”，两个名称均指同一家公司。";

const chineseBrandPageTitles: Record<string, string> = {
  "/": "闪铸装饰 FLASH CAST | 吉隆坡装修、室内设计与定制柜",
  "/about": "关于闪铸装饰 FLASH CAST | 装修规划与项目协调",
  "/contact": "联系闪铸装饰 FLASH CAST | 吉隆坡装修咨询",
};
const chineseBrandHomeDescription = "闪铸装饰亦称“闪铸设计”，为吉隆坡、雪兰莪与巴生谷提供住宅及商业装修、室内设计、定制柜体与项目协调。按现场情况和确认范围准备报价。";

const readIdentityNames = (settings?: BrandSettings | null) =>
  [settings?.company_name, settings?.brand_name]
    .map((name) => name?.trim() || "")
    .filter(Boolean);

// Only attach these owner-confirmed names to the existing FLASH CAST identity.
const isFlashCastIdentity = (settings?: BrandSettings | null) =>
  readIdentityNames(settings).every((name) => {
    const normalized = name.replace(/[\s.]/g, "").toUpperCase();
    return normalized === "FLASHCAST" || normalized === "FLASHCASTSDNBHD"
      || CHINESE_BRAND_NAMES.some((alias) => alias === name);
  });

export const getPublicSiteName = (settings?: BrandSettings | null): string =>
  isFlashCastIdentity(settings)
    ? DEFAULT_BRAND_NAME
    : settings?.company_name?.trim() || settings?.brand_name?.trim() || DEFAULT_COMPANY_NAME;

export const getPublicBrandAliases = (settings?: BrandSettings | null): string[] => {
  const names = readIdentityNames(settings);
  return [...new Set(isFlashCastIdentity(settings)
    ? [PRIMARY_CHINESE_BRAND_NAME, ...names, DEFAULT_BRAND_NAME, DEFAULT_COMPANY_NAME, ...CHINESE_BRAND_NAMES]
    : names)];
};

export const getChineseBrandLine = (settings: BrandSettings | null | undefined, language: string): string | null =>
  language === "zh" && isFlashCastIdentity(settings)
    ? `${PRIMARY_CHINESE_BRAND_NAME} ${DEFAULT_BRAND_NAME} · ${DEFAULT_COMPANY_NAME}`
    : null;

export const getHeaderChineseBrandName = (settings?: BrandSettings | null): string | null =>
  isFlashCastIdentity(settings) ? PRIMARY_CHINESE_BRAND_NAME : null;

export const getChineseBrandDisplayName = (settings: BrandSettings | null | undefined, language: string): string | null =>
  language === "zh" && isFlashCastIdentity(settings) ? `${PRIMARY_CHINESE_BRAND_NAME} ${DEFAULT_BRAND_NAME}` : null;

export const getChineseBrandAssociation = (settings: BrandSettings | null | undefined, language: string): string | null =>
  language === "zh" && isFlashCastIdentity(settings) ? chineseBrandAssociation : null;

export const withChineseBrandMetadata = (
  metadata: { title: string; description: string },
  language: string,
  path: string,
  settings?: BrandSettings | null,
): { title: string; description: string } => {
  if (language !== "zh" || !isFlashCastIdentity(settings)) return metadata;

  const route = (path.split(/[?#]/)[0] ?? "").replace(/^\/(?:zh|en)(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const title = chineseBrandPageTitles[route];
  if (title) return {
    title,
    description: route === "/" ? chineseBrandHomeDescription : metadata.description,
  };

  // Preserve the existing service-specific titles outside the three-page change.
  const brand = route === "/services/design" ? "闪铸设计"
    : route === "/services/renovation" ? "闪铸装修" : null;
  if (!brand) return metadata;
  return {
    title: metadata.title.includes(brand) ? metadata.title : `${brand} | ${metadata.title}`,
    description: CHINESE_BRAND_NAMES.every((alias) => metadata.description.includes(alias))
      ? metadata.description
      : `${metadata.description.trim()}${metadata.description.trim() ? " " : ""}闪铸装饰、闪铸设计和闪铸装修是 FLASH CAST 的中文品牌名称。`,
  };
};
