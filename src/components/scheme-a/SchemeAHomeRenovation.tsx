import { ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeRenovationText } from "@/i18n/homeRenovationText";
import { trackCtaClick } from "@/lib/analytics";
import { buildQuotePath, quoteProjectTypeFromServiceSlug } from "@/lib/quoteContext";

const livingComparisonImages = {
  before: "/images/before-after/old-terrace-concept-v2/living-before.webp",
  after: "/images/before-after/old-terrace-concept-v2/living-after.webp",
} as const;

const SchemeAHomeRenovation = () => {
  const { language } = useLanguage();
  const copy = homeRenovationText[language];
  const quotePath = buildQuotePath({
    source: "service",
    title: copy.quoteTitle,
    projectType: quoteProjectTypeFromServiceSlug("old-house"),
  });

  return (
    <section className="home-renovation" data-home-section="renovation" aria-labelledby="home-renovation-title">
      <div className="scheme-a-frame home-renovation__frame">
        <header className="scheme-a-heading home-section-heading home-renovation__header">
          <p className="scheme-a-eyebrow">{copy.eyebrow}</p>
          <h2 id="home-renovation-title">{copy.title}</h2>
          <p className="home-renovation__intro">{copy.intro}</p>
        </header>

        <figure className="home-renovation__visual">
          <ImageComparisonSlider
            className="scheme-a-transformation__compare home-renovation__compare"
            positionVariable="--compare-position"
            initialValue={52}
            min={8}
            max={92}
            ariaLabel={copy.compareAria}
          >
            <DeferredSmartImage
              src={livingComparisonImages.after}
              alt={copy.imageAlt}
              className="scheme-a-transformation__image scheme-a-transformation__image--after"
              placeholderClassName="scheme-a-transformation__image-shell"
              width={1600}
              height={900}
              sourceWidth={1600}
              candidateWidths={[360, 560, 720, 900, 1200, 1600]}
              sizes="(max-width: 767px) 100vw, 88vw"
              quality={86}
              rootMargin="1200px 0px"
            />
            <div className="scheme-a-transformation__before" aria-hidden="true">
              <DeferredSmartImage
                src={livingComparisonImages.before}
                alt=""
                className="scheme-a-transformation__image scheme-a-transformation__image--before"
                placeholderClassName="scheme-a-transformation__image-shell"
                width={1600}
                height={900}
                sourceWidth={1600}
                candidateWidths={[360, 560, 720, 900, 1200, 1600]}
                sizes="(max-width: 767px) 100vw, 88vw"
                quality={86}
                rootMargin="1200px 0px"
              />
            </div>
            <span className="scheme-a-transformation__label scheme-a-transformation__label--before">{copy.before}</span>
            <span className="scheme-a-transformation__label scheme-a-transformation__label--after">{copy.after}</span>
            <span className="scheme-a-transformation__divider" aria-hidden="true" />
            <span className="scheme-a-transformation__handle" aria-hidden="true">↔</span>
          </ImageComparisonSlider>
          <figcaption className="home-renovation__caption">
            <span className="home-renovation__room">{copy.room}</span>
            <span className="home-renovation__hint">{copy.hint}</span>
          </figcaption>
        </figure>

        <div className="home-renovation__details">
          <ul className="home-renovation__features">
            {copy.features.map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}</strong>
                <span>{feature.description}</span>
              </li>
            ))}
          </ul>
          <div className="home-renovation__actions">
            <LocalizedLink className="scheme-a-link home-renovation__service-link" to="/services/old-house">
              {copy.serviceLink}
              <ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
            <LocalizedLink
              className="scheme-a-button home-renovation__quote-link"
              to={quotePath}
              onClick={() => trackCtaClick("quote", "home_old_house", { destination: quotePath })}
            >
              {copy.quoteLink}
              <ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchemeAHomeRenovation;
