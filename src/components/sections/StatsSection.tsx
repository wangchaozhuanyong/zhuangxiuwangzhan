import Reveal from "@/components/Reveal";
import { ShieldCheck, Star, Clock, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMemo } from "react";
import { usePublishedHomeSection } from "@/hooks/usePublishedContent";

const stats = {
  en: [
    { icon: Star, value: "200+", label: "Completed Projects", desc: "Across Kuala Lumpur and Selangor for residential, commercial, and industrial spaces", iconClass: "text-gold" },
    { icon: Clock, value: "10+", label: "Years Experience", desc: "A decade of renovation experience in the Malaysian market", iconClass: "text-gold" },
    { icon: Users, value: "Trusted", label: "By Homeowners & Businesses", desc: "Repeat clients and referrals are our strongest endorsement", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "Registered Company", desc: "Fully registered with workmanship warranty on all projects", iconClass: "text-gold" },
  ],
  zh: [
    { icon: Star, value: "200+", label: "已完成项目", desc: "覆盖吉隆坡与雪兰莪的住宅、商业及工业项目", iconClass: "text-gold" },
    { icon: Clock, value: "10+", label: "行业经验", desc: "在马来西亚装修市场拥有十年以上经验", iconClass: "text-gold" },
    { icon: Users, value: "信赖", label: "业主与企业客户", desc: "回头客户与转介绍是我们最重要的认可", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "注册公司", desc: "正规注册公司，所有项目提供施工保修", iconClass: "text-gold" },
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
