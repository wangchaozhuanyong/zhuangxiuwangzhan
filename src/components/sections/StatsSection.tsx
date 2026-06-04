import Reveal from "@/components/Reveal";
import { ShieldCheck, Star, Clock, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSectionText } from "@/i18n/homeSectionsText";
import { useMemo } from "react";
import { usePublishedHomeSection } from "@/hooks/usePublishedContent";
import type { PublishedHomeSection } from "@/lib/homeContentApi";

const iconMap: Record<string, any> = {
  star: Star,
  clock: Clock,
  users: Users,
  shieldcheck: ShieldCheck,
  shield_check: ShieldCheck,
  shield: ShieldCheck,
};

type StatsSectionProps = {
  section?: PublishedHomeSection | null;
};

const StatsSection = ({ section: providedSection }: StatsSectionProps) => {
  const { language } = useLanguage();
  const { data: fetchedSection } = usePublishedHomeSection(language, "stats", { enabled: providedSection === undefined });
  const section = providedSection === undefined ? fetchedSection : providedSection;

  const display = useMemo(() => {
    const items = Array.isArray(section?.items) ? section.items : [];
    if (!items.length) {
      return homeSectionText.stats[language].map((item) => ({
        ...item,
        icon: iconMap[item.icon] || Star,
        iconClass: "text-gold",
      }));
    }
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
                  <div className="text-limit-1 font-display mb-1 text-2xl font-bold md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="text-limit-2 font-semibold text-sm mb-2">{stat.label}</div>
                  <p className="text-limit-3 mt-auto text-muted-foreground text-xs leading-relaxed">{stat.desc}</p>
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
