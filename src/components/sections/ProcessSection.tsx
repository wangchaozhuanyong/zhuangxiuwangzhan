import Reveal from "@/components/Reveal";
import { useT } from "@/i18n/useT";

const ProcessSection = () => {
  const t = useT();

  const steps = Array.from({ length: 6 }, (_, i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: t(`process.step${i + 1}.title`),
    desc: t(`process.step${i + 1}.desc`),
  }));

  return (
    <section className="section-padding bg-background" id="process">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 80}>
              <div className="luxury-card-muted p-6 hover-lift h-full">
                <span className="font-display text-3xl font-bold text-gold/30 mb-2 block">{step.num}</span>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
