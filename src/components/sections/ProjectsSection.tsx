import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSectionText } from "@/i18n/homeSectionsText";
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

const normalizeTypeKey = (type: string) => type.toLowerCase().replace(/\s+/g, "-");

type ProjectsSectionProps = {
  projects?: FeaturedProject[];
};

const HOME_PROJECT_CARD_IMAGE_WIDTHS = [360, 560, 720, 900];

const ProjectsSection = ({ projects: providedProjects }: ProjectsSectionProps) => {
  const { language } = useLanguage();
  const t = useT();
  const copy = homeSectionText.projects[language];
  const { data: fetchedProjects = [] } = usePublishedProjectSummaries(language, 6, { enabled: providedProjects === undefined });
  const projects = providedProjects === undefined ? fetchedProjects : providedProjects;
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
              const label = copy.typeLabels[typeKey as keyof typeof copy.typeLabels] || project.type || copy.typeLabels.renovation;
              const title = translateDisplayText(project.title || "", language);
              const description = translateDisplayText(project.description || "", language);
              const location = translateDisplayText(project.location || "", language);
              const isPriorityImage = index < 3;

              return (
                <Reveal key={project.slug} delay={index * 80}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="projects-showcase-card card-equal group rounded-card-lg"
                  >
                    <div className="projects-showcase-media relative aspect-[4/3] overflow-hidden img-zoom">
                      {project.thumbnail ? (
                        <DeferredSmartImage
                          src={project.thumbnail}
                          alt={project.thumbnailAlt || `${title} - ${location}`}
                          width={800}
                          height={600}
                          loading={isPriorityImage ? "eager" : "lazy"}
                          fetchPriority={isPriorityImage ? "high" : "auto"}
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                          candidateWidths={HOME_PROJECT_CARD_IMAGE_WIDTHS}
                          quality={70}
                          rootMargin="2400px"
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
