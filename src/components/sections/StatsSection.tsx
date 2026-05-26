import Reveal from "@/components/Reveal";
import { ShieldCheck, Star, Clock, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const stats = {
  en: [
    { icon: Star, value: "200+", label: "Completed Projects", desc: "Across Kuala Lumpur and Selangor for residential, commercial, and industrial spaces", iconClass: "text-gold" },
    { icon: Clock, value: "10+", label: "Years Experience", desc: "A decade of renovation experience in the Malaysian market", iconClass: "text-gold" },
    { icon: Users, value: "Trusted", label: "By Homeowners & Businesses", desc: "Repeat clients and referrals are our strongest endorsement", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "Registered Company", desc: "Fully registered with workmanship warranty on all projects", iconClass: "text-gold" },
  ],
  zh: [
    { icon: Star, value: "200+", label: "完成项目", desc: "覆盖吉隆坡与雪兰莪的住宅、商业和工业空间", iconClass: "text-gold" },
    { icon: Clock, value: "10+", label: "行业经验", desc: "长期服务马来西亚装修市场，熟悉本地施工需求", iconClass: "text-gold" },
    { icon: Users, value: "信赖", label: "业主与企业客户", desc: "回头客和客户转介绍，是我们最重要的信任来源", iconClass: "text-gold" },
    { icon: ShieldCheck, value: "SSM", label: "注册公司", desc: "正规注册公司，项目提供施工保修与后续支持", iconClass: "text-gold" },
  ],
};

const StatsSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-background border-b border-border/70" id="trust">
      <div className="container-narrow px-5 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats[language].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="luxury-card p-6 text-center hover-lift">
                  <div className="flex justify-center mb-3">
                    <Icon className={`w-7 h-7 ${stat.iconClass}`} />
                  </div>
                  <div className="font-display text-2xl md:text-3xl font-bold mb-1">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-sm mb-2">{stat.label}</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{stat.desc}</p>
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
