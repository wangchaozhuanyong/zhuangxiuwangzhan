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
