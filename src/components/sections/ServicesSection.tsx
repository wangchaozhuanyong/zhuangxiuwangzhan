import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedServiceSummaries } from "@/hooks/usePublishedContent";
import LocalizedLink from "@/components/LocalizedLink";
import {
  Home, Paintbrush, Ruler, UtensilsCrossed, Bath, Briefcase, Store, Palette, Wrench, FileCheck,
  LucideIcon,
} from "lucide-react";

const residentialRenovation = "/images/services/residential-renovation.webp";
const builtinSolutions = "/images/services/builtin-solutions.webp";
const bathroomRenovation = "/images/services/bathroom-renovation.webp";
const commercialWorks = "/images/services/commercial-works.webp";
const kitchenRenovation = "/images/services/kitchen-renovation.webp";
const officeRenovation = "/images/services/office-renovation.webp";

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
  { icon: Briefcase, titleKey: "services.office", descKey: "services.office.desc", link: "/services/office-renovation" },
  { icon: Store, titleKey: "services.shoplot", descKey: "services.shoplot.desc", link: "/services/shop-renovation" },
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
  "office-renovation": Briefcase,
  shoplot: Store,
  "shop-renovation": Store,
  "artistic-coating": Palette,
  "old-house": Wrench,
  approval: FileCheck,
};

const serviceVisualBySlug: Record<string, string> = {
  renovation: residentialRenovation,
  "residential-renovation": residentialRenovation,
  design: commercialWorks,
  builtin: builtinSolutions,
  "builtin-solutions": builtinSolutions,
  kitchen: kitchenRenovation,
  "kitchen-renovation": kitchenRenovation,
  bathroom: bathroomRenovation,
  "bathroom-renovation": bathroomRenovation,
  office: officeRenovation,
  "office-renovation": officeRenovation,
  shoplot: commercialWorks,
  "shop-renovation": commercialWorks,
  "commercial-works": commercialWorks,
};
const SERVICE_SECTION_IMAGE_WIDTHS = [360, 560, 720];

const getServiceVisual = (linkOrSlug: string) => {
  const slug = linkOrSlug.split("/").filter(Boolean).pop() || linkOrSlug;
  return serviceVisualBySlug[slug];
};

type ServicesSectionProps = {
  services?: Array<{
    slug: string;
    title: string;
    summary?: string;
    description?: string;
  }>;
};

const ServicesSection = ({ services: providedServices }: ServicesSectionProps) => {
  const t = useT();
  const { language } = useLanguage();
  const { data: fetchedServices = [] } = usePublishedServiceSummaries(language, 8, { enabled: providedServices === undefined });
  const dynamicServices = providedServices === undefined ? fetchedServices : providedServices;

  const fallbackServices = serviceEntries.map((service) => ({
    icon: service.icon,
    title: t(service.titleKey),
    desc: t(service.descKey),
    link: service.link,
    visual: getServiceVisual(service.link),
  }));

  const mappedDynamicServices = dynamicServices.map((service) => ({
        icon: iconBySlug[service.slug] || Home,
        title: service.title,
        desc: service.summary || service.description,
        link: service.slug === "old-house" ? "/services/old-house" : `/services/${service.slug}`,
        visual: getServiceVisual(service.slug),
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
                  className="service-catalog-card group"
                >
                  {service.visual && (
                    <span className="service-catalog-media" aria-hidden="true">
                      <DeferredSmartImage
                        src={service.visual}
                        alt=""
                        loading="lazy"
                        width={600}
                        height={420}
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 24vw"
                        candidateWidths={SERVICE_SECTION_IMAGE_WIDTHS}
                        quality={72}
                        rootMargin="1200px"
                      />
                    </span>
                  )}
                  <span className="service-catalog-icon" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="service-catalog-copy">
                    <h3 className="heading-safe font-display text-base font-semibold transition-colors group-hover:text-gold">
                      {service.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {service.desc}
                    </p>
                  </span>
                  <span className="service-catalog-arrow" aria-hidden="true">
                    <ArrowRight className="h-4 w-4" />
                  </span>
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
