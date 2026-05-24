import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Home, Paintbrush, Ruler, UtensilsCrossed, Bath, Briefcase, Store, Palette, Wrench, FileCheck,
  LucideIcon,
} from "lucide-react";

interface ServiceEntry {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  link: string;
}

const serviceEntries: ServiceEntry[] = [
  { icon: Home, titleKey: "services.fullRenovation", descKey: "services.fullRenovation.desc", link: "/services/renovation" },
  { icon: Paintbrush, titleKey: "services.interiorDesign", descKey: "services.interiorDesign.desc", link: "/services/design" },
  { icon: Ruler, titleKey: "services.builtIn", descKey: "services.builtIn.desc", link: "/services/builtin" },
  { icon: UtensilsCrossed, titleKey: "services.kitchen", descKey: "services.kitchen.desc", link: "/services/kitchen" },
  { icon: Bath, titleKey: "services.bathroom", descKey: "services.bathroom.desc", link: "/services/bathroom" },
  { icon: Briefcase, titleKey: "services.office", descKey: "services.office.desc", link: "/services/office" },
  { icon: Store, titleKey: "services.shoplot", descKey: "services.shoplot.desc", link: "/services/shoplot" },
  { icon: Palette, titleKey: "services.artisticCoating", descKey: "services.artisticCoating.desc", link: "/services/artistic-coating" },
  { icon: Wrench, titleKey: "services.oldHouse", descKey: "services.oldHouse.desc", link: "/services/old-house" },
  { icon: FileCheck, titleKey: "services.permit", descKey: "services.permit.desc", link: "/services/approval" },
];

const ServicesSection = () => {
  const t = useT();

  return (
    <section className="section-padding bg-background" id="services">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("services.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {t("services.subtitle")}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {serviceEntries.map((service, i) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.link} delay={i * 60}>
                <Link
                  to={service.link}
                  className="group block rounded-lg bg-card border border-border p-5 hover-lift h-full"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="font-display text-sm font-semibold leading-tight group-hover:text-gold transition-colors">
                      {t(service.titleKey)}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t(service.descKey)}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={600}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/services">{t("cta.viewAllServices")} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ServicesSection;
