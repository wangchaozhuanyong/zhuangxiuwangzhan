import DesktopFloatingCta from "@/components/DesktopFloatingCta";
import MobileActionBar from "@/components/MobileActionBar";

/** 全站营销页浮动联系入口（移动端底栏 + 桌面右下角） */
const FloatingCTA = () => (
  <>
    <MobileActionBar />
    <DesktopFloatingCta />
  </>
);

export default FloatingCTA;
