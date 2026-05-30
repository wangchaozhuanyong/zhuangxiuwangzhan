import Reveal from "@/components/Reveal";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedProcessSteps } from "@/hooks/usePublishedContent";
import { CheckCircle2, ClipboardList, DraftingCompass, Hammer, MessageCircle, Ruler } from "lucide-react";

const stepIcons = [MessageCircle, Ruler, DraftingCompass, ClipboardList, Hammer, CheckCircle2];

const ProcessSection = () => {
  const t = useT();
  const { language } = useLanguage();
  const steps = Array.from({ length: 6 }, (_, i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: t(`process.step${i + 1}.title`),
    desc: t(`process.step${i + 1}.desc`),
  }));

  const { data: publishedSteps } = usePublishedProcessSteps(language);
  const displaySteps = publishedSteps?.length
    ? publishedSteps
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((row, idx) => ({
          num: String(row.step_number || idx + 1).padStart(2, "0"),
          title: row.title,
          desc: row.description,
        }))
    : steps;

  return (
    <section className="home-process-section section-padding bg-background" id="process">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("process.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {t("process.subtitle")}
            </p>
          </div>
        </Reveal>

        <div className="process-blueprint">
          {displaySteps.map((step, i) => {
            const Icon = stepIcons[i % stepIcons.length];

            return (
              <Reveal key={step.num} delay={i * 80}>
                <article className="process-blueprint-card hover-lift">
                  <div className="process-blueprint-node" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="process-blueprint-content">
                    <div className="process-blueprint-kicker">
                      <span>{step.num}</span>
                      <span>{language === "zh" ? "步骤" : "Step"}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
