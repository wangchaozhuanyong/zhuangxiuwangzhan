import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import { ForestContentState } from "@/components/forest/ForestPagePrimitives";
import { usePublishedServiceAreas, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { locationsPageText } from "@/i18n/newClientPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const Locations = () => {
  const { language } = useLanguage();
  const t = locationsPageText[language];
  const { data: locations = [], isLoading, isError, refetch } = usePublishedServiceAreas(language);
  const { data: pageContent } = usePublishedSitePage(language, "locations");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.locations);

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords}
        canonicalPath="/locations"
      />
      <JsonLdBreadcrumb items={[{ name: language === "zh" ? "首页" : "Home", url: "/" }, { name: language === "zh" ? "服务地区" : "Locations", url: "/locations" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.title}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
        variant="compact"
      />

      <section className="forest-chapter forest-chapter--raised">
        {isLoading ? (
          <ForestContentState variant="loading" compact description={t.loading} />
        ) : isError ? (
          <ForestContentState variant="error" compact description={t.error} onRetry={() => void refetch()} />
        ) : locations.length === 0 ? (
          <ForestContentState variant="empty" compact description={t.empty} />
        ) : (
          <div className="forest-area-grid">
            {locations.map((location) => (
              <LocalizedLink key={location.slug} to={`/locations/${location.slug}`} className="forest-area-card">
                <MapPin aria-hidden="true" />
                <h2>{location.name}</h2>
                <p>{location.description}</p>
                {location.propertyTypes.length ? (
                  <div className="forest-area-card__property">
                    <p><Building2 aria-hidden="true" /> {t.commonProperty}</p>
                    <span>{location.propertyTypes.slice(0, 3).join(", ")}</span>
                  </div>
                ) : null}
                <span className="forest-listing-card__action">{t.view}<ArrowUpRight aria-hidden="true" /></span>
              </LocalizedLink>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Locations;
