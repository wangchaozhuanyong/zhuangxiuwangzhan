import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { usePublishedProjectSummaries } from "@/hooks/usePublishedContent";
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
    subtitle: "Explore residential, commercial, kitchen, built-in furniture, and fit-out project references across Kuala Lumpur and Selangor.",
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
  const { data: projects = [] } = usePublishedProjectSummaries(language, 6);
  const featured = useMemo(() => projects.slice(0, 6) as FeaturedProject[], [projects]);

  return (
    <section className="section-padding projects-showcase-section" id="projects">
      <div className="container-narrow projects-showcase-inner">
        <Reveal>
          <div className="projects-showcase-header mb-10 text-center md:mb-14">
            <p className="projects-showcase-eyebrow">{copy.eyebrow}</p>
            <h2 className="projects-showcase-title font-display">{copy.title}</h2>
            <p className="projects-showcase-subtitle">{copy.subtitle}</p>
          </div>
        </Reveal>

        {featured.length ? (
          <div className="projects-showcase-grid card-grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="projects-showcase-card card-equal group rounded-card-lg"
                  >
                    <div className="projects-showcase-media relative aspect-[4/3] overflow-hidden img-zoom">
                      {project.thumbnail ? (
                        <SmartImage
                          src={project.thumbnail}
                          alt={project.thumbnailAlt || `${title} - ${location}`}
                          width={800}
                          height={600}
                          loading="lazy"
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="projects-showcase-placeholder flex h-full items-center justify-center px-6 text-center text-sm">FLASH CAST</div>
                      )}
                      <span className="projects-showcase-chip absolute left-3 top-3">
                        {label}
                      </span>
                    </div>
                    <div className="projects-showcase-body card-equal-body p-5">
                      <h3 className="projects-showcase-card-title mb-2 font-display text-base font-semibold transition-colors">{title}</h3>
                      <p className="projects-showcase-location mb-3 flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{location}</span>
                      </p>
                      <p className="projects-showcase-description line-clamp-2 text-xs leading-relaxed">{description}</p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="projects-showcase-empty rounded-card-lg p-8 text-center text-sm">{copy.empty}</div>
        )}

        <Reveal delay={500}>
          <div className="mt-10 text-center">
            <Link to="/projects" className="projects-showcase-button btn-press">
              <span>{t("cta.viewAllProjects")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProjectsSection;
