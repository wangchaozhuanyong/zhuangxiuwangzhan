import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { getPublishedProjects } from "@/lib/contentApi";
import { translateDisplayText } from "@/i18n/displayLabels";

type FeaturedProject = {
  slug: string;
  title: string;
  type: string;
  location: string;
  description: string;
  thumbnail?: string;
  thumbnailAlt?: string;
};

const sectionCopy = {
  en: {
    eyebrow: "Selected Work",
    title: "Recent Renovation Projects",
    subtitle:
      "Explore completed residential, commercial, kitchen, built-in furniture, and fit-out projects across Kuala Lumpur and Selangor.",
    empty: "Project highlights are being updated. Contact us for recent site references.",
  },
  zh: {
    eyebrow: "精选案例",
    title: "近期装修项目",
    subtitle: "查看我们在吉隆坡和雪兰莪完成的住宅、商业、厨房、定制家具和空间装修案例。",
    empty: "项目案例正在更新中。你也可以联系我们获取近期工地参考。",
  },
};

const typeLabels = {
  en: {
    residential: "Residential",
    commercial: "Commercial",
    "built-in": "Built-In",
    warehouse: "Warehouse",
    exterior: "Exterior",
    office: "Office",
    kitchen: "Kitchen",
    retail: "Retail",
    renovation: "Renovation",
  },
  zh: {
    residential: "住宅",
    commercial: "商业",
    "built-in": "定制家具",
    warehouse: "仓储",
    exterior: "外墙",
    office: "办公室",
    kitchen: "厨房",
    retail: "零售",
    renovation: "装修",
  },
};

const normalizeTypeKey = (type: string) => type.toLowerCase().replace(/\s+/g, "-");

const ProjectsSection = () => {
  const { language } = useLanguage();
  const t = useT();
  const copy = sectionCopy[language];
  const [featured, setFeatured] = useState<FeaturedProject[]>([]);

  useEffect(() => {
    let active = true;

    void getPublishedProjects(language).then((projects) => {
      if (!active) return;
      setFeatured(projects.slice(0, 6));
    });

    return () => {
      active = false;
    };
  }, [language]);

  return (
    <section className="section-padding bg-surface-dark" id="projects">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
              {copy.eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-white">
              {copy.title}
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-white/65">
              {copy.subtitle}
            </p>
          </div>
        </Reveal>

        {featured.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((project, index) => {
              const typeKey = normalizeTypeKey(project.type || "renovation");
              const label =
                typeLabels[language][typeKey as keyof (typeof typeLabels)[typeof language]] ||
                project.type ||
                typeLabels[language].renovation;
              const title = translateDisplayText(project.title || "", language);
              const description = translateDisplayText(project.description || "", language);

              return (
                <Reveal key={project.slug} delay={index * 80}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="group block h-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-gold/45 hover:bg-white/[0.055]"
                  >
                    <div className="aspect-[4/3] overflow-hidden img-zoom relative bg-white/5">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.thumbnailAlt || `${project.title} - ${project.location}`}
                          loading="lazy"
                          width={800}
                          height={600}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/55">
                          FLASH CAST
                        </div>
                      )}
                      <span className="absolute top-3 left-3 rounded-sm border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                        {label}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-base font-semibold mb-2 text-white group-hover:text-gold transition-colors">
                        {title}
                      </h3>
                      <p className="mb-3 flex items-center gap-1.5 text-xs text-white/55">
                        <MapPin className="h-3.5 w-3.5 text-gold" />
                        {project.location}
                      </p>
                      <p className="text-white/62 text-xs leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-white/65">
            {copy.empty}
          </div>
        )}

        <Reveal delay={500}>
          <div className="text-center mt-10">
            <Button
              variant="outline"
              className="btn-press border-white/25 bg-white/5 text-white hover:bg-white/12 hover:text-white"
              asChild
            >
              <Link to="/projects">
                {t("cta.viewAllProjects")} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProjectsSection;
