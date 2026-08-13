/** 移动端底部行动栏高度（与 Tailwind h-16 一致） */
export const MOBILE_ACTION_BAR_HEIGHT = "4rem";

/** z-index 层级：菜单 > 顶栏 > 底部行动栏 > 桌面浮动 CTA */
export const PUBLIC_CHROME_Z = {
  mobileMenu: 60,
  header: 50,
  mobileActionBar: 45,
  desktopFloating: 40,
} as const;

export const isAdminPath = (pathname: string) => pathname.startsWith("/admin");

const IMMERSIVE_PUBLIC_PATHS = new Set([
  "/",
  "/projects",
  "/products",
  "/promotions",
  "/contact",
  "/quote",
  "/about",
  "/services",
  "/materials",
  "/process",
  "/blog",
  "/faq",
  "/locations",
]);

const IMMERSIVE_PUBLIC_PREFIXES = [
  "/projects/",
  "/products/",
  "/services/",
  "/materials/",
  "/blog/",
  "/locations/",
  "/landing/",
];

/** 最终版设计中，拥有首屏大图并让顶栏叠加显示的公开页面。 */
export const isImmersivePublicPath = (pathname: string) => {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return IMMERSIVE_PUBLIC_PATHS.has(normalizedPath)
    || IMMERSIVE_PUBLIC_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
};
