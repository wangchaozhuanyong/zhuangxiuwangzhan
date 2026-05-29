import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedServices } from "@/hooks/usePublishedContent";
import LocalizedLink from "@/components/LocalizedLink";
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

const iconBySlug: Record<string, LucideIcon> = {
  renovation: Home,
  design: Paintbrush,
  builtin: Ruler,
  kitchen: UtensilsCrossed,
  bathroom: Bath,
  office: Briefcase,
  shoplot: Store,
  "artistic-coating": Palette,
  "old-house": Wrench,
  approval: FileCheck,
};

const ServicesSection = () => {
  const t = useT();
  const { language } = useLanguage();
  const { data: dynamicServices = [] } = usePublishedServices(language);

  const fallbackServices = serviceEntries.map((service) => ({
    icon: service.icon,
    title: t(service.titleKey),
    desc: t(service.descKey),
    link: service.link,
  }));

  const mappedDynamicServices = dynamicServices.map((service) => ({
        icon: iconBySlug[service.slug] || Home,
        title: service.title,
        desc: service.summary || service.description,
        link: service.slug === "old-house" ? "/services/old-house" : `/services/${service.slug}`,
      }));

  const services = (
    dynamicServices.length
      ? [
          ...mappedDynamicServices,
          ...fallbackServices.filter((fallback) => !mappedDynamicServices.some((item) => item.link === fallback.link)),
        ]
      : fallbackServices
  ).slice(0, 8);

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

        <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.link} delay={i * 60}>
                <LocalizedLink
                  to={service.link}
                  className="card-equal group luxury-card-muted relative block overflow-hidden p-[22px] transition-colors hover:border-accent/35 hover-lift"
                >
                  <span className="absolute right-4 top-4 font-display text-3xl font-bold text-foreground/[0.05]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 transition-colors group-hover:border-accent/40">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="heading-safe min-w-0 flex-1 font-display text-sm font-semibold leading-snug transition-colors group-hover:text-gold">
                      {service.title}
                    </h3>
                  </div>
                  <p className="card-equal-body text-muted-foreground text-xs leading-relaxed">
                    {service.desc}
                  </p>
                </LocalizedLink>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={600}>
          <div className="mt-8 text-center md:mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <LocalizedLink to="/services">{t("cta.viewAllServices")} <ArrowRight className="w-4 h-4 ml-2" /></LocalizedLink>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ServicesSection;
