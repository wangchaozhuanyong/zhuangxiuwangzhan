import { useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import ImmersiveHero from "@/components/ImmersiveHero";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { schemeAHomeText } from "@/i18n/schemeAText";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";

type ForestHomeProps = {
  content: PublishedHomeContentBundle | undefined;
};

const ForestHome = ({ content }: ForestHomeProps) => {
  const { language } = useLanguage();
  const copy = schemeAHomeText[language];
  const [comparePosition, setComparePosition] = useState(48);

  const hero = content?.heroSlides[0];
  const heroImage = hero?.image || content?.pageContent?.image_url || "/images/heroes/hero-luxury-living.webp";
  const heroAlt = hero?.alt || content?.pageContent?.alt || copy.heroTitle + copy.heroTitleAccent;
  const projects = content?.projects.slice(0, 6) || [];
  const featuredProject = projects[0];
  const supportingProject = projects[1] || projects[0];
  const projectImage = featuredProject?.thumbnail || "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp";
  const materialImage = supportingProject?.images[1]
    || supportingProject?.thumbnail
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
  const projectMeta = featuredProject
    ? [displayText(featuredProject.type), featuredProject.location].filter(Boolean).join(" / ")
    : copy.projectFallbackMeta;

  return (
    <div className="scheme-a-home">
      <ImmersiveHero className="scheme-a-hero" aria-labelledby="scheme-a-home-title">
        <figure className="scheme-a-hero__media" data-cinematic-media>
          <SmartImage
            src={heroImage}
            alt={heroAlt}
            width={1920}
            height={1200}
            sizes="100vw"
            candidateWidths={[360, 560, 720, 900, 1200, 1600]}
            quality={88}
            loading="eager"
            fetchPriority="high"
          />
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
            <LocalizedLink className="scheme-a-button scheme-a-button--paper" to="/quote">
              {copy.quoteCta}
            </LocalizedLink>
            <LocalizedLink className="scheme-a-button scheme-a-button--glass" to="/projects">
              {copy.projectsCta}
              <ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
          </div>
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
            alt={featuredProject?.thumbnailAlt || featuredProject?.title || copy.projectFallbackTitle}
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
        <div
          className="scheme-a-compare"
          style={{ "--scheme-compare": `${comparePosition}%` } as CSSProperties}
          data-cinematic-media
        >
          <SmartImage src={afterImage} alt={beforeAfter?.alt || copy.after} width={1600} height={1000} sizes="100vw" candidateWidths={[360, 560, 720, 900, 1200, 1600]} quality={86} loading="lazy" />
          <div className="scheme-a-compare__before" aria-hidden="true">
            <SmartImage src={beforeImage} alt="" width={1600} height={1000} sizes="100vw" candidateWidths={[360, 560, 720, 900, 1200, 1600]} quality={86} loading="lazy" />
          </div>
          <span className="scheme-a-compare__tag scheme-a-compare__tag--before">{copy.before}</span>
          <span className="scheme-a-compare__tag scheme-a-compare__tag--after">{copy.after}</span>
          <span className="scheme-a-compare__line" aria-hidden="true" />
          <input
            type="range"
            min="8"
            max="92"
            value={comparePosition}
            aria-label={copy.compareLabel}
            onChange={(event) => setComparePosition(Number(event.target.value))}
          />
        </div>
        <p className="scheme-a-frame scheme-a-before__note">{copy.beforeNote}</p>
      </section>

      <section className="scheme-a-contact" data-cinematic-section>
        <div className="scheme-a-frame">
          <p className="scheme-a-eyebrow">{copy.contactLabel}</p>
          <h2>{copy.contactTitle}</h2>
          <LocalizedLink className="scheme-a-button scheme-a-button--gold" to="/quote">
            {copy.contactCta}
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

export default ForestHome;
