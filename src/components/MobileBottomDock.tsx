import MobileActionBar from "@/components/MobileActionBar";
import ForestBottomNav from "@/components/forest/ForestBottomNav";

/** 路由切换时保持固定容器挂载，仅替换当前页面对应的底栏内容。 */
const MobileBottomDock = () => (
  <div className="mobile-bottom-dock">
    <MobileActionBar />
    <ForestBottomNav />
  </div>
);

export default MobileBottomDock;
