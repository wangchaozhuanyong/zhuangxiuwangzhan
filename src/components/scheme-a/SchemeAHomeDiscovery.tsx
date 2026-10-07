import { ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import LocalizedLink from "@/components/LocalizedLink";
import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { usePublishedHomeJournal, usePublishedHomeServiceAreas } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateBlogCategory, translateDisplayText } from "@/i18n/displayLabels";
import { homeDiscoveryText } from "@/i18n/homeDiscoveryText";
import { getBlogEditorialMedia } from "@/lib/blogEditorialMedia";
import { resolveBlogTopic } from "@/lib/blogTopics";

export function HomeJournal() {
  const { language } = useLanguage();
  const copy = homeDiscoveryText[language].journal;
  const resultsQuery = usePublishedHomeJournal(language);
  const posts = (resultsQuery.data ?? [])
    .filter((post) => post.slug && post.title.trim() && post.image.trim())
    .slice(0, 3);

  return (
    <section className="home-journal" data-home-section="journal" aria-labelledby="home-journal-title">
      <div className="scheme-a-frame">
        <header className="scheme-a-heading home-section-heading home-journal__header">
          <p className="scheme-a-eyebrow">{copy.label}</p>
          <h2 id="home-journal-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </header>
        <PublicResultsBoundary
          query={resultsQuery}
          loading={copy.loading}
          error={copy.error}
          isEmpty={resultsQuery.data !== undefined && posts.length === 0}
          empty={copy.empty}
        >
          <div className="home-journal__grid">
            {posts.map((post) => {
              const title = translateDisplayText(post.title, language);
              const editorialMedia = getBlogEditorialMedia(post.slug, post.image);
              const disclosure = editorialMedia?.cmsCover === post.image
                ? editorialMedia.disclosure[language]
                : undefined;

              return (
                <article className="home-journal__card" key={post.slug}>
                  <LocalizedLink className="home-journal__link" to={`/blog/${post.slug}`}>
                    <div className="home-journal__image">
                      <DeferredSmartImage
                        src={post.image}
                        alt={translateDisplayText(post.imageAlt || post.title, language)}
                        className="home-journal__bitmap"
                        placeholderClassName="home-journal__image-shell"
                        width={900}
                        height={650}
                        candidateWidths={[360, 560, 720, 900, 1200]}
                        sizes="(max-width: 767px) 90vw, (max-width: 1023px) 44vw, 29vw"
                        rootMargin="1200px 0px"
                      />
                      {disclosure ? <span className="home-journal__disclosure">{disclosure}</span> : null}
                    </div>
                    <div className="home-journal__copy">
                      <p className="home-journal__category">{translateBlogCategory(resolveBlogTopic(post.category, post.slug), language)}</p>
                      <h3>{title}</h3>
                      <p className="home-journal__excerpt">{translateDisplayText(post.excerpt, language)}</p>
                      <span className="home-journal__read">{copy.read}<ArrowUpRight aria-hidden="true" /></span>
                    </div>
                  </LocalizedLink>
                </article>
              );
            })}
          </div>
        </PublicResultsBoundary>
        <div className="home-journal__actions">
          <LocalizedLink className="scheme-a-link" to="/blog">{copy.viewAll}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
        </div>
      </div>
    </section>
  );
}

export function HomeServiceAreas() {
  const { language } = useLanguage();
  const copy = homeDiscoveryText[language].areas;
  const resultsQuery = usePublishedHomeServiceAreas(language);
  const areas = (resultsQuery.data ?? [])
    .filter((area) => area.slug && area.name.trim())
    .slice(0, 8);

  return (
    <section className="home-areas" data-home-section="areas" aria-labelledby="home-areas-title">
      <div className="scheme-a-frame">
        <header className="scheme-a-heading home-section-heading home-areas__header">
          <p className="scheme-a-eyebrow">{copy.label}</p>
          <h2 id="home-areas-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </header>
        <PublicResultsBoundary
          query={resultsQuery}
          loading={copy.loading}
          error={copy.error}
          isEmpty={resultsQuery.data !== undefined && areas.length === 0}
          empty={copy.empty}
        >
          <ul className="home-areas__links">
            {areas.map((area) => (
              <li key={area.slug}>
                <LocalizedLink to={`/locations/${area.slug}`}>
                  <span>{area.name}</span>
                  <ArrowUpRight aria-hidden="true" />
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </PublicResultsBoundary>
        <div className="home-areas__actions">
          <LocalizedLink className="scheme-a-link" to="/locations">{copy.viewAll}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
        </div>
      </div>
    </section>
  );
}
