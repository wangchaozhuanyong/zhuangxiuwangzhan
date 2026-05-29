import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { usePublishedProjects } from "@/hooks/usePublishedContent";
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
    subtitle: "Explore completed residential, commercial, kitchen, built-in furniture, and fit-out projects across Kuala Lumpur and Selangor.",
    empty: "Project highlights are being updated. Contact us for recent site references.",
  },
  zh: {
    eyebrow: "精选案例",
    title: "近期装修案例",
    subtitle: "查看我们在吉隆坡与雪兰莪完成的住宅、商业、厨房、定制家具与空间装潢项目。",
    empty: "项目案例正在更新中。欢迎联系我们获取近期工地参考。",
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
    "built-in": "定制内嵌家具",
    warehouse: "仓库",
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
  const { data: projects = [] } = usePublishedProjects(language);
  const featured = useMemo(() => projects.slice(0, 6) as FeaturedProject[], [projects]);

  return (
    <section className="section-padding bg-surface-dark" id="projects">
      <div className="container-narrow">
        <Reveal>
          <div className="mb-10 text-center md:mb-14">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{copy.eyebrow}</p>
            <h2 className="font-display mb-3 text-3xl font-bold text-surface-dark-foreground md:text-4xl">{copy.title}</h2>
            <p className="mx-auto max-w-2xl text-sm text-surface-dark-foreground/65 md:text-base">{copy.subtitle}</p>
          </div>
        </Reveal>

        {featured.length ? (
          <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project, index) => {
              const typeKey = normalizeTypeKey(project.type || "renovation");
              const label = typeLabels[language][typeKey as keyof (typeof typeLabels)[typeof language]] || project.type || typeLabels[language].renovation;
              const title = translateDisplayText(project.title || "", language);
              const description = translateDisplayText(project.description || "", language);
              const location = translateDisplayText(project.location || "", language);

              return (
                <Reveal key={project.slug} delay={index * 80}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="card-equal group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-gold/45 hover:bg-white/[0.055]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5 img-zoom">
                      {project.thumbnail ? (
                        <SmartImage
                          src={project.thumbnail}
                          alt={project.thumbnailAlt || `${title} - ${location}`}
                          width={800}
                          height={600}
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-surface-dark-foreground/55">FLASH CAST</div>
                      )}
                      <span className="absolute left-3 top-3 rounded-sm border border-white/20 bg-surface-dark/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-surface-dark-foreground backdrop-blur-sm">
                        {label}
                      </span>
                    </div>
                    <div className="card-equal-body p-5">
                      <h3 className="mb-2 font-display text-base font-semibold text-surface-dark-foreground transition-colors group-hover:text-gold">{title}</h3>
                      <p className="mb-3 flex items-center gap-1.5 text-xs text-surface-dark-foreground/55">
                        <MapPin className="h-3.5 w-3.5 text-gold" />
                        {location}
                      </p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-surface-dark-foreground/62">{description}</p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-surface-dark-foreground/65">{copy.empty}</div>
        )}

        <Reveal delay={500}>
          <div className="mt-10 text-center">
            <Button variant="outline" className="btn-press border-white/25 bg-white/5 text-surface-dark-foreground hover:bg-white/12 hover:text-surface-dark-foreground" asChild>
              <Link to="/projects">
                {t("cta.viewAllProjects")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProjectsSection;
