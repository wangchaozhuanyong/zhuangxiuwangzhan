export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "xiaohongshu";

const approvedSocialHosts: Record<SocialPlatform, ReadonlySet<string>> = {
  facebook: new Set(["facebook.com", "www.facebook.com"]),
  instagram: new Set(["instagram.com", "www.instagram.com"]),
  tiktok: new Set(["tiktok.com", "www.tiktok.com"]),
  xiaohongshu: new Set(["xiaohongshu.com", "www.xiaohongshu.com", "xhslink.cn"]),
};

// Account identity comes from the protected website settings editor, never a
// second code-owned account list. Keep the URL checks shared by UI and Edge SEO.
export const safeSocialProfileUrl = (
  value: string | null | undefined,
  platform: SocialPlatform,
): string => {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.port
      || url.search
      || url.hash
      || !approvedSocialHosts[platform].has(url.hostname.toLowerCase())
      || url.pathname === "/"
      || url.pathname.includes("not-created-yet")
      || (platform === "tiktok" && !/^\/@[a-zA-Z0-9._]+\/?$/.test(url.pathname))
      || (platform === "xiaohongshu" && !(url.hostname === "xhslink.cn"
        ? /^\/o\/[a-zA-Z0-9]+\/?$/.test(url.pathname)
        : /^\/user\/profile\/[a-fA-F0-9]{24}\/?$/.test(url.pathname)))
    ) return "";
    return url.toString();
  } catch {
    return "";
  }
};

export const getSocialProfileUrls = (settings: {
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  xiaohongshu_url?: string | null;
} | null | undefined): string[] => [
  safeSocialProfileUrl(settings?.facebook_url, "facebook"),
  safeSocialProfileUrl(settings?.instagram_url, "instagram"),
  safeSocialProfileUrl(settings?.tiktok_url, "tiktok"),
  safeSocialProfileUrl(settings?.xiaohongshu_url, "xiaohongshu"),
].filter(Boolean);
