type BrandSettings = {
  company_name?: string | null;
  brand_name?: string | null;
};

export const CHINESE_BRAND_NAMES = ["闪铸装饰", "闪铸设计", "闪铸装修"] as const;

const DEFAULT_COMPANY_NAME = "FLASH CAST SDN. BHD.";
const DEFAULT_BRAND_NAME = "FLASH CAST";
const chineseBrandAssociation = "闪铸装饰、闪铸设计和闪铸装修是 FLASH CAST 的中文品牌名称。";

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
    ? [...names, DEFAULT_BRAND_NAME, DEFAULT_COMPANY_NAME, ...CHINESE_BRAND_NAMES]
    : names)];
};

export const getChineseBrandLine = (settings: BrandSettings | null | undefined, language: string): string | null =>
  language === "zh" && isFlashCastIdentity(settings)
    ? `中文品牌：${CHINESE_BRAND_NAMES.join(" · ")}`
    : null;

export const getHeaderChineseBrandName = (settings?: BrandSettings | null): string | null =>
  isFlashCastIdentity(settings) ? CHINESE_BRAND_NAMES[1] : null;

export const withChineseBrandMetadata = (
  metadata: { title: string; description: string },
  language: string,
  path: string,
  settings?: BrandSettings | null,
): { title: string; description: string } => {
  if (language !== "zh" || !isFlashCastIdentity(settings)) return metadata;

  const route = (path.split(/[?#]/)[0] ?? "").replace(/^\/(?:zh|en)(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const brand = route === "/" || route === "/about" ? CHINESE_BRAND_NAMES[0]
    : route === "/services/design" ? CHINESE_BRAND_NAMES[1]
    : route === "/services/renovation" ? CHINESE_BRAND_NAMES[2]
    : null;
  if (!brand) return metadata;

  return {
    title: metadata.title.includes(brand) ? metadata.title : `${brand} | ${metadata.title}`,
    description: CHINESE_BRAND_NAMES.every((alias) => metadata.description.includes(alias))
      ? metadata.description
      : `${metadata.description.trim()}${metadata.description.trim() ? " " : ""}${chineseBrandAssociation}`,
  };
};
