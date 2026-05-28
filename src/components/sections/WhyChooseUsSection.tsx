import Reveal from "@/components/Reveal";
import IconCardGrid from "@/components/blocks/IconCardGrid";
import { useT } from "@/i18n/useT";
import { Paintbrush, MessageCircle, Layers, Target, Wrench, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedHomeSection } from "@/lib/homeContentApi";

const WhyChooseUsSection = () => {
  const t = useT();
  const { language } = useLanguage();
  const [items, setItems] = useState<any[] | null>(null);

  const reasons = useMemo(
    () => [
      { icon: Paintbrush, title: t("whyUs.design.title"), desc: t("whyUs.design.desc") },
      { icon: MessageCircle, title: t("whyUs.quotation.title"), desc: t("whyUs.quotation.desc") },
      { icon: Layers, title: t("whyUs.material.title"), desc: t("whyUs.material.desc") },
      { icon: Target, title: t("whyUs.supervision.title"), desc: t("whyUs.supervision.desc") },
      { icon: Wrench, title: t("whyUs.workmanship.title"), desc: t("whyUs.workmanship.desc") },
      { icon: ShieldCheck, title: t("whyUs.ssm.title"), desc: t("whyUs.ssm.desc") },
    ],
    [t],
  );

  const iconMap: Record<string, any> = useMemo(
    () => ({
      paintbrush: Paintbrush,
      "message-circle": MessageCircle,
      messagecircle: MessageCircle,
      layers: Layers,
      target: Target,
      wrench: Wrench,
      shieldcheck: ShieldCheck,
      shield_check: ShieldCheck,
    }),
    [],
  );

  useEffect(() => {
    let active = true;
    setItems(null);
    void getPublishedHomeSection(language, "why_choose_us").then((section) => {
      if (!active) return;
      const list = Array.isArray(section?.items) ? section!.items : [];
      setItems(list.length ? list : []);
    });
    return () => {
      active = false;
    };
  }, [language]);

  const displayReasons = useMemo(() => {
    if (!items) return reasons;
    if (items.length === 0) return reasons;
    return items.map((item: any) => {
      const key = String(item.icon || "").toLowerCase().replace(/\s+/g, "");
      const Icon = iconMap[key] || Paintbrush;
      return {
        icon: Icon,
        title: language === "zh" ? String(item.title_zh || item.title_en || "") : String(item.title_en || item.title_zh || ""),
        desc: language === "zh" ? String(item.desc_zh || item.desc_en || "") : String(item.desc_en || item.desc_zh || ""),
      };
    });
  }, [items, reasons, language, iconMap]);

  return (
    <section className="section-padding bg-muted" id="why-us">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("whyUs.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {t("whyUs.subtitle")}
            </p>
          </div>
        </Reveal>

        <IconCardGrid items={displayReasons} columns={3} layout="horizontal" />
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
