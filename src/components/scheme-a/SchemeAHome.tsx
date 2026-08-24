import { ArrowRight, ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";
import ImmersiveHero from "@/components/ImmersiveHero";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import { SchemeAFaqList } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { schemeAHomeText } from "@/i18n/schemeAText";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";
import { isRenderingConceptProject } from "@/lib/projectContentClassification";
import { resolveSchemeAHomePresentation } from "@/lib/schemeAHomePresentation";
import { buildSupabaseSrcSet, type SupabaseTargetAspectRatio } from "@/lib/supabaseImage";

type SchemeAHomeProps = {
  content: PublishedHomeContentBundle | undefined;
};

const HOME_HERO_ASSETS = {
  desktop: "/images/heroes/v4/home-atelier-desktop.webp",
  tablet: "/images/heroes/v4/home-atelier-tablet.webp",
  mobile: "/images/heroes/v4/home-atelier-mobile.webp",
} as const;

const PROJECT_CARD_MOBILE_MEDIA = "(max-width: 47.9375rem)";
const PROJECT_CARD_MOBILE_SIZES = "(max-width: 397px) 78vw, 310px";
const PROJECT_CARD_MOBILE_WIDTHS = [360, 560, 720, 960];
const PROJECT_CARD_DESKTOP_WIDTHS = [360, 560, 720, 900, 1200, 1600];
const PROJECT_CARD_MOBILE_ASPECT_RATIO = { width: 4, height: 5 } as const satisfies SupabaseTargetAspectRatio;
const PROJECT_CARD_DESKTOP_ASPECT_RATIOS = [
  PROJECT_CARD_MOBILE_ASPECT_RATIO,
  { width: 16, height: 10 },
  { width: 1, height: 1 },
] as const satisfies readonly SupabaseTargetAspectRatio[];
const PROJECT_CARD_INTRINSIC_WIDTH = 960;

const buildHomeHeroSrcSet = (src: string, sourceWidth: number, widths: number[]) => {
  const relativePath = src.replace(/^\/images\/heroes\//, "");
  const responsive = widths
    .filter((width) => width < sourceWidth)
    .map((width) => `/images/_responsive/heroes/w${width}/${relativePath} ${width}w`);

  return [...responsive, `${src} ${sourceWidth}w`].join(", ");
};

const SchemeAHome = ({ content }: SchemeAHomeProps) => {
  const { language } = useLanguage();
  const copy = schemeAHomeText[language];
  const presentation = resolveSchemeAHomePresentation(content, language, copy);
  const hero = content?.heroSlides[0];
  const configuredHeroImage = hero?.image || content?.pageContent?.image_url;
  const usesAtelierHero = !configuredHeroImage || configuredHeroImage.endsWith("/hero-luxury-living.webp");
  const heroImage = usesAtelierHero ? HOME_HERO_ASSETS.desktop : configuredHeroImage;
  const heroAlt = usesAtelierHero
    ? copy.heroAlt
    : hero?.alt || content?.pageContent?.alt || copy.heroTitle + copy.heroTitleAccent;
  const projects = (content?.projects || [])
    .filter((project, index, allProjects) => {
      const identity = project.thumbnail || project.slug;
      return allProjects.findIndex((candidate) => (candidate.thumbnail || candidate.slug) === identity) === index;
    })
    .slice(0, 6);
  const featuredProject = projects[0];
  const supportingProjects = projects.slice(1, 4);
  const projectImage = featuredProject?.thumbnail || "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp";
  const displayedProjectImages = new Set([projectImage, ...supportingProjects.map((project) => project.thumbnail)]);
  const materialImage = projects
    .flatMap((project) => [...project.images, project.thumbnail])
    .find((image) => image && !displayedProjectImages.has(image))
    || "/images/projects/proj1-condo-2.webp";
  const beforeAfter = content?.beforeAfterItems[0];
  const beforeImage = beforeAfter?.before_image_url || "/images/before-after/before-living.webp";
  const afterImage = beforeAfter?.after_image_url || "/images/before-after/after-living.webp";
  const displayText = (value: string) => language === "zh" ? translateDisplayText(value, language) : value;
  const serviceItems = content?.services.slice(0, 4).map((service) => ({
    title: service.title,
    summary: service.summary,
    path: `/services/${service.slug}`,
  })) || [];
  const resolvedServices = serviceItems.length ? serviceItems : copy.serviceFallbacks;
  const featuredProjectIsConcept = isRenderingConceptProject(featuredProject);
  const projectMeta = featuredProject
    ? [displayText(featuredProject.type), featuredProjectIsConcept ? copy.projectConceptLabel : ""].filter(Boolean).join(" · ")
    : copy.projectFallbackMeta;
  const faqItems = (content?.faqs || [])
    .map((faq) => ({ question: faq.question, answer: faq.answer }))
    .filter((faq) => faq.question && faq.answer);

  return (
    <div className="scheme-a-home scheme-a-home--atelier">
      <ImmersiveHero className="scheme-a-hero" aria-labelledby="scheme-a-home-title">
        <figure className="scheme-a-hero__media" data-cinematic-media>
          {usesAtelierHero ? (
            <picture className="scheme-a-hero__picture">
              <source
                media="(max-width: 47.9375rem)"
                srcSet={buildHomeHeroSrcSet(HOME_HERO_ASSETS.mobile, 1200, [360, 560, 720, 900])}
                sizes="100vw"
              />
              <source
                media="(max-width: 73.6875rem)"
                srcSet={buildHomeHeroSrcSet(HOME_HERO_ASSETS.tablet, 1600, [560, 720, 900, 1200])}
                sizes="100vw"
              />
              <SmartImage
                src={HOME_HERO_ASSETS.desktop}
                alt={heroAlt}
                width={2880}
                height={1620}
                sizes="(min-width: 90rem) 58vw, (min-width: 73.75rem) 60vw, 100vw"
                candidateWidths={[720, 900, 1200, 1600]}
                sourceWidth={2880}
                quality={88}
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          ) : (
            <SmartImage
              src={heroImage}
              alt={heroAlt}
              width={1920}
              height={1080}
              sizes="100vw"
              candidateWidths={[360, 560, 720, 900, 1200, 1600]}
              quality={88}
              loading="eager"
              fetchPriority="high"
            />
          )}
          {usesAtelierHero && <figcaption>{copy.heroConceptLabel}</figcaption>}
        </figure>
        <div className="scheme-a-hero__copy">
          <p className="scheme-a-eyebrow">{copy.heroKicker}</p>
          <h1 id="scheme-a-home-title">
            <span>{copy.heroTitle}</span>
            {" "}
            <span>{copy.heroTitleAccent}</span>
          </h1>
          <p className="scheme-a-hero__lead">{copy.heroDescription}</p>
          <div className="scheme-a-actions">
            <LocalizedLink className="scheme-a-button scheme-a-button--paper" to={presentation.heroAction.url}>
              {presentation.heroAction.label}
            </LocalizedLink>
            <LocalizedLink className="scheme-a-button scheme-a-button--glass" to="/projects">
              {copy.projectsCta}
              <ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
          </div>
          {presentation.stats.length > 0 && (
            <div className="scheme-a-hero__metrics" data-content-source={presentation.statsSource} aria-label={language === "zh" ? "交付保障指标" : "Delivery trust metrics"}>
              {presentation.stats.map((stat) => (
                <div key={stat.label} className="scheme-a-hero__metric-item">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          <ul className="scheme-a-hero__disciplines" aria-label={copy.heroCapabilitiesLabel}>
            {copy.heroCapabilities.map((capability) => <li key={capability}>{capability}</li>)}
          </ul>
        </div>
      </ImmersiveHero>

      <section className="scheme-a-principle" data-cinematic-section>
        <div className="scheme-a-frame scheme-a-principle__inner">
          <p className="scheme-a-eyebrow">{copy.principleLabel}</p>
          <h2>{copy.principleTitle}</h2>
        </div>
      </section>

      <section className="scheme-a-statement" data-cinematic-section>
        <div className="scheme-a-frame">
          <p className="scheme-a-eyebrow">{copy.statementLabel}</p>
          <blockquote>{copy.statementQuote}</blockquote>
        </div>
      </section>

      <section className="scheme-a-project" data-cinematic-section>
        <div className="scheme-a-frame scheme-a-section-head">
          <div>
            <p className="scheme-a-eyebrow">{copy.projectLabel}</p>
            <h2>{copy.projectTitle}</h2>
          </div>
          <LocalizedLink to="/projects">
            {copy.projectAll}
            <ArrowUpRight aria-hidden="true" />
          </LocalizedLink>
        </div>
        <LocalizedLink
          className="scheme-a-project__media"
          to={featuredProject ? `/projects/${featuredProject.slug}` : "/projects"}
          aria-label={featuredProject?.title || copy.projectFallbackTitle}
          data-cinematic-media
        >
          <DeferredSmartImage
            src={projectImage}
            alt={featuredProjectIsConcept ? `${featuredProject?.title || copy.projectFallbackTitle} · ${copy.projectConceptLabel}` : featuredProject?.thumbnailAlt || featuredProject?.title || copy.projectFallbackTitle}
            width={1600}
            height={1050}
            sizes="100vw"
            candidateWidths={[560, 720, 960, 1200, 1600]}
            quality={86}
            loading="lazy"
          />
        </LocalizedLink>
        <div className="scheme-a-frame scheme-a-project__meta">
          <div>
            <strong>{featuredProject?.title || copy.projectFallbackTitle}</strong>
            <span>{projectMeta}</span>
          </div>
          <p>{featuredProject?.description || copy.projectDescription}</p>
        </div>
        {supportingProjects.length > 0 && (
          <div className="scheme-a-frame scheme-a-project__collection">
            {supportingProjects.map((project, projectIndex) => {
              const desktopAspectRatio = PROJECT_CARD_DESKTOP_ASPECT_RATIOS[projectIndex]
                || PROJECT_CARD_MOBILE_ASPECT_RATIO;
              const desktopIntrinsicHeight = Math.round(
                PROJECT_CARD_INTRINSIC_WIDTH * (desktopAspectRatio.height / desktopAspectRatio.width),
              );
              const mobileSrcSet = buildSupabaseSrcSet(project.thumbnail, PROJECT_CARD_MOBILE_WIDTHS, {
                quality: 84,
                resize: "cover",
                targetAspectRatio: PROJECT_CARD_MOBILE_ASPECT_RATIO,
              });

              return (
                <LocalizedLink
                  key={project.slug}
                  className="scheme-a-project__collection-item"
                  to={`/projects/${project.slug}`}
                  aria-label={project.title}
                >
                  <span className="scheme-a-project__collection-media">
                    <DeferredSmartImage
                      src={project.thumbnail}
                      alt={project.thumbnailAlt || project.title}
                      width={PROJECT_CARD_INTRINSIC_WIDTH}
                      height={desktopIntrinsicHeight}
                      sizes={projectIndex === 0
                        ? "(max-width: 767px) 78vw, (max-width: 1100px) 46vw, 48vw"
                        : "(max-width: 767px) 78vw, (max-width: 1100px) 46vw, 38vw"}
                      candidateWidths={PROJECT_CARD_DESKTOP_WIDTHS}
                      quality={84}
                      resize="cover"
                      targetAspectRatio={desktopAspectRatio}
                      pictureSources={mobileSrcSet
                        ? [{
                            media: PROJECT_CARD_MOBILE_MEDIA,
                            sizes: PROJECT_CARD_MOBILE_SIZES,
                            srcSet: mobileSrcSet,
                          }]
                        : undefined}
                      loading="lazy"
                    />
                  </span>
                  <span className="scheme-a-project__collection-copy">
                    <strong>{project.title}</strong>
                    <small>{[displayText(project.type), isRenderingConceptProject(project) ? copy.projectConceptLabel : ""].filter(Boolean).join(" · ")}</small>
                  </span>
                </LocalizedLink>
              );
            })}
          </div>
        )}
      </section>

      <section className="scheme-a-services" data-cinematic-section>
        <div className="scheme-a-frame scheme-a-services__layout">
          <header>
            <p className="scheme-a-eyebrow">{copy.servicesLabel}</p>
            <h2>{copy.servicesTitle}</h2>
          </header>
          <ol>
            {resolvedServices.map((service) => (
              <li key={`${service.path}-${service.title}`}>
                <LocalizedLink to={service.path}>
                  <span>{service.title}</span>
                  <small>{service.summary}</small>
                  <ArrowUpRight aria-hidden="true" />
                </LocalizedLink>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="scheme-a-materials" data-cinematic-section>
        <div className="scheme-a-frame scheme-a-materials__layout">
          <figure className="scheme-a-materials__media" data-cinematic-media>
            <DeferredSmartImage
              src={materialImage}
              alt={copy.materialTitle}
              width={1280}
              height={960}
              sizes="(max-width: 767px) calc(100vw - 44px), 52vw"
              candidateWidths={[560, 720, 960, 1280]}
              quality={86}
              loading="lazy"
            />
          </figure>
          <div className="scheme-a-materials__copy">
            <h2>{copy.materialTitle}</h2>
            <p>{copy.materialBody}</p>
            {copy.materialTags && (
              <ul className="scheme-a-materials__tags" aria-label={language === "zh" ? "精选材质特性" : "Curated material tags"}>
                {copy.materialTags.map((tag) => (
                  <li key={tag}><span>•</span>{tag}</li>
                ))}
              </ul>
            )}
            <LocalizedLink to="/materials">
              {copy.materialCta}
              <ArrowRight aria-hidden="true" />
            </LocalizedLink>
          </div>
        </div>
      </section>

      <section className="scheme-a-before" data-cinematic-section>
        <div className="scheme-a-frame scheme-a-section-head scheme-a-section-head--compact">
          <div>
            <p className="scheme-a-eyebrow">{copy.beforeLabel}</p>
            <h2>{copy.beforeTitle}</h2>
          </div>
        </div>
        <ImageComparisonSlider
          className="scheme-a-compare"
          positionVariable="--scheme-compare"
          initialValue={48}
          min={8}
          max={92}
          ariaLabel={copy.compareLabel}
        >
          <SmartImage src={afterImage} alt={beforeAfter?.alt || copy.after} width={1600} height={1000} sizes="100vw" candidateWidths={[360, 560, 720, 900, 1200, 1600]} quality={86} loading="lazy" />
          <div className="scheme-a-compare__before" aria-hidden="true">
            <SmartImage src={beforeImage} alt="" width={1600} height={1000} sizes="100vw" candidateWidths={[360, 560, 720, 900, 1200, 1600]} quality={86} loading="lazy" />
          </div>
          <span className="scheme-a-compare__tag scheme-a-compare__tag--before">{copy.before}</span>
          <span className="scheme-a-compare__tag scheme-a-compare__tag--after">{copy.after}</span>
          <span className="scheme-a-compare__line" aria-hidden="true" />
        </ImageComparisonSlider>
        <p className="scheme-a-frame scheme-a-before__note">{copy.beforeNote}</p>
      </section>

      {presentation.processSteps.length > 0 && (
        <section className="scheme-a-home-process" data-content-source={presentation.processSource} data-cinematic-section>
          <div className="scheme-a-frame scheme-a-section-head">
            <div>
              <p className="scheme-a-eyebrow">{copy.processLabel}</p>
              <h2>{copy.processTitle}</h2>
            </div>
          </div>
          <div className="scheme-a-frame scheme-a-home-process__grid">
            {presentation.processSteps.map((step) => (
              <div key={step.step} className="scheme-a-home-process__card">
                <span className="scheme-a-home-process__number">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {faqItems.length > 0 && (
        <section className="scheme-a-home-faq" data-cinematic-section>
          <div className="scheme-a-frame scheme-a-home-faq__layout">
            <header>
              <p className="scheme-a-eyebrow">{copy.faqLabel}</p>
              <h2>{copy.faqTitle}</h2>
              <p>{copy.faqDescription}</p>
            </header>
            <SchemeAFaqList items={faqItems} />
          </div>
        </section>
      )}

      <section className="scheme-a-contact" data-content-source={presentation.contactSource} data-cinematic-section>
        <div className="scheme-a-frame">
          <p className="scheme-a-eyebrow">{presentation.contact.label}</p>
          <h2>{presentation.contact.title}</h2>
          <LocalizedLink className="scheme-a-button scheme-a-button--gold" to={presentation.contact.ctaUrl}>
            {presentation.contact.ctaLabel}
            <ArrowUpRight aria-hidden="true" />
          </LocalizedLink>
          <div className="scheme-a-contact__regions">
            {copy.regions.map((region) => <span key={region}>{region}</span>)}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchemeAHome;
