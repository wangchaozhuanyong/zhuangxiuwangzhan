import Reveal from "@/components/Reveal";
import { ShieldCheck, Star, Clock, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMemo } from "react";
import { usePublishedHomeSection } from "@/hooks/usePublishedContent";

const stats = {
  en: [
    { icon: Star, value: "Scope", label: "Clear Project Planning", desc: "Site condition, usage needs, materials, budget, and timeline are reviewed before quotation.", iconClass: "text-gold" },
    { icon: Clock, value: "KL & Selangor", label: "Local Service Areas", desc: "Renovation enquiries are handled for Kuala Lumpur, Selangor, and nearby Klang Valley areas.", iconClass: "text-gold" },
    { icon: Users, value: "Homes & Businesses", label: "Residential and Commercial", desc: "Support for home renovation, office fit-out, shop renovation, built-in furniture, and selected industrial spaces.", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "Registered Company", desc: "Company registration and contact details are shown clearly for client verification.", iconClass: "text-gold" },
  ],
  zh: [
    { icon: Star, value: "Scope", label: "清楚规划范围", desc: "报价前先了解现场情况、使用需求、材料、预算和时间安排。", iconClass: "text-gold" },
    { icon: Clock, value: "KL & Selangor", label: "本地服务区域", desc: "主要处理 Kuala Lumpur、Selangor 和附近 Klang Valley 区域的装修咨询。", iconClass: "text-gold" },
    { icon: Users, value: "住宅与商业", label: "住宅和商业项目", desc: "可按需求沟通住宅装修、办公室装修、店铺装修、定制柜体和部分工业空间。", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "注册公司", desc: "网站清楚展示公司注册、地址和联系方式，方便客户核对。", iconClass: "text-gold" },
  ],
};

const iconMap: Record<string, any> = {
  star: Star,
  clock: Clock,
  users: Users,
  shieldcheck: ShieldCheck,
  shield_check: ShieldCheck,
  shield: ShieldCheck,
};

const StatsSection = () => {
  const { language } = useLanguage();
  const { data: section } = usePublishedHomeSection(language, "stats");

  const display = useMemo(() => {
    const items = Array.isArray(section?.items) ? section.items : [];
    if (!items.length) return stats[language];
    return items.map((item: any) => {
      const key = String(item.icon || "").toLowerCase().replace(/\s+/g, "");
      const Icon = iconMap[key] || Star;
      return {
        icon: Icon,
        value: String(item.value || ""),
        label: language === "zh" ? String(item.label_zh || item.label_en || "") : String(item.label_en || item.label_zh || ""),
        desc: language === "zh" ? String(item.desc_zh || item.desc_en || "") : String(item.desc_en || item.desc_zh || ""),
        iconClass: "text-gold",
      };
    });
  }, [section, language]);

  return (
    <section className="bg-background py-10 md:py-14 lg:py-16 border-b border-border/70" id="trust">
      <div className="container-narrow">
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {display.map((stat: any, i: number) => {
            const Icon = stat.icon;
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="luxury-card-stats flex h-full flex-col p-6 text-center hover-lift">
                  <div className="mb-3 flex justify-center">
                    <Icon className={`h-7 w-7 stroke-[1.25] ${stat.iconClass}`} />
                  </div>
                  <div className="font-display mb-1 text-2xl font-bold md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-sm mb-2">{stat.label}</div>
                  <p className="mt-auto text-muted-foreground text-xs leading-relaxed">{stat.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
