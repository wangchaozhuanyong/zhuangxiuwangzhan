import DesktopFloatingCta from "@/components/DesktopFloatingCta";
import MobileBottomDock from "@/components/MobileBottomDock";

/** 全站营销页浮动联系入口（移动端底栏 + 桌面右下角） */
const FloatingCTA = () => (
  <>
    <MobileBottomDock />
    <DesktopFloatingCta />
  </>
);

export default FloatingCTA;
