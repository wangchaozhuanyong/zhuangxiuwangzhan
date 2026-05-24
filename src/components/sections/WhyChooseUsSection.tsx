import Reveal from "@/components/Reveal";
import IconCardGrid from "@/components/templates/IconCardGrid";
import { useT } from "@/i18n/useT";
import { Paintbrush, MessageCircle, Layers, Target, Wrench, ShieldCheck } from "lucide-react";

const WhyChooseUsSection = () => {
  const t = useT();

  const reasons = [
    { icon: Paintbrush, title: t("whyUs.design.title"), desc: t("whyUs.design.desc") },
    { icon: MessageCircle, title: t("whyUs.quotation.title"), desc: t("whyUs.quotation.desc") },
    { icon: Layers, title: t("whyUs.material.title"), desc: t("whyUs.material.desc") },
    { icon: Target, title: t("whyUs.supervision.title"), desc: t("whyUs.supervision.desc") },
    { icon: Wrench, title: t("whyUs.workmanship.title"), desc: t("whyUs.workmanship.desc") },
    { icon: ShieldCheck, title: t("whyUs.ssm.title"), desc: t("whyUs.ssm.desc") },
  ];

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

        <IconCardGrid items={reasons} columns={3} layout="horizontal" />
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
