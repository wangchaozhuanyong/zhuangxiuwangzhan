import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { materialsData } from "@/data/materials";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { useT } from "@/i18n/useT";

const copy = {
  en: {
    title: "Material Library",
    subtitle: "Browse quality materials - then request a quote",
  },
  zh: {
    title: "材料库",
    subtitle: "浏览精选材料，再获取报价",
  },
};

const MaterialsSection = () => {
  const { language } = useLanguage();
  const t = useT();
  const content = copy[language];

  return (
    <section className="section-padding bg-muted" id="materials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mb-4 mx-auto" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{content.title}</h2>
            <p className="text-muted-foreground text-sm md:text-base">{content.subtitle}</p>
          </div>
        </Reveal>

        <div className="card-grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
          {materialsData.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 60}>
              <Link
                to={`/materials/category/${cat.slug}`}
                className="group block h-full"
              >
                <div className="card-equal rounded-lg overflow-hidden bg-card border border-border hover-lift transition-colors hover:border-accent/30">
                  <div className="aspect-square overflow-hidden img-zoom">
                    <SmartImage
                      src={cat.image}
                      alt={translateDisplayText(cat.name, language)}
                      width={200}
                      height={200}
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="card-equal-body p-4 md:p-5">
                    <p className="font-medium text-xs md:text-sm text-center group-hover:text-accent transition-colors leading-tight">
                      {translateDisplayText(cat.name, language)}
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/materials">
                {t("cta.viewAll")} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MaterialsSection;
