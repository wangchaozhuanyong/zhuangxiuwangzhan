import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { usePublishedMaterialBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import Reveal from "@/components/Reveal";
import HeroBanner from "@/components/blocks/HeroBanner";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText, translateMaterialCategory, translateMaterialType, translateSpaceLabel } from "@/i18n/displayLabels";
import { buildQuotePath } from "@/lib/quoteContext";
import { materialDetailPageText } from "@/i18n/materialDetailPageText";
import {
  mergeMaterialCategoriesWithFallback,
  type MaterialCatalogCategory,
  type MaterialCatalogItem,
} from "@/lib/materialCatalog";

const MATERIAL_DETAIL_IMAGE_WIDTHS = [560, 720, 900, 1200];
const MATERIAL_RELATED_IMAGE_WIDTHS = [360, 560, 720];

const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);


const MaterialDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = materialDetailPageText[language];

  let mergedMaterial: MaterialCatalogItem | null = null;
  let mergedCategory: MaterialCatalogCategory | null = null;
  const { data: published, isPending: materialPending } = usePublishedMaterialBySlug(slug, language);
  const mergedCategories = mergeMaterialCategoriesWithFallback(published?.category ? [published.category] : undefined);

  for (const categoryItem of mergedCategories) {
    const found = categoryItem.items.find((materialItem) => materialItem.slug === slug);
    if (found) {
      mergedMaterial = found;
      mergedCategory = categoryItem;
      break;
    }
  }

  const material = mergedMaterial;
  const category = mergedCategory;
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const displayMaterialName = material ? translateDisplayText(material.name, language) : "";
  const displayMaterialDescription = material ? translateDisplayText(material.description, language) : "";
  const displayMaterialSummary = stripHtml(displayMaterialDescription);
  const displayMaterialType = material ? translateMaterialType(material.type || "", language) : "";

  if (materialPending && (!material || !category)) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!material || !category) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/materials/${slug || ""}`} noIndex />
        <div className="container-narrow mx-auto max-w-lg">
          <div className="subpage-form-panel p-6 md:p-8">
            <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
            <Button asChild className="btn-brand-primary"><Link to="/materials">{t.viewAll}</Link></Button>
          </div>
        </div>
      </main>
    );
  }

  const otherMaterials = category.items.filter((item) => item.slug !== slug);
  const pros = Array.isArray(material.pros) ? material.pros.filter(Boolean) : [];
  const cons = Array.isArray(material.cons) ? material.cons.filter(Boolean) : [];
  const quotePath = buildQuotePath({
    source: "material",
    title: displayMaterialName,
    projectType: "Others",
  });

  return (
    <main className="pt-site-header">
      <PageMeta
        title={formatText(t.metaTitle, { name: displayMaterialName })}
        description={formatText(t.metaDescription, {
          description: displayMaterialSummary,
          spaces: material.suitableSpaces.map((space: string) => translateSpaceLabel(space, language)).join(language === "zh" ? "、" : ", "),
        })}
        keywords={formatText(t.metaKeywords, { name: displayMaterialName, category: displayCategoryName })}
        canonicalPath={`/materials/${material.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }, { name: displayMaterialName, url: `/materials/${material.slug}` }]} />

      <HeroBanner
        image={material.image}
        imageAlt={material.alt || displayMaterialName}
        label={displayCategoryName}
        title={displayMaterialName}
        description={displayMaterialSummary}
        backTo={`/materials/category/${category.slug}`}
        backLabel={displayCategoryName}
        variant="detail"
        meta={
          <>
            <span>{t.type}: {displayMaterialType || translateDisplayText(material.type || "", language)}</span>
            <span>{t.color}: {translateDisplayText(material.color || "-", language)}</span>
            <span>{t.texture}: {translateDisplayText(material.texture || "-", language)}</span>
          </>
        }
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="material-detail-showcase">
            <Reveal direction="left">
              <div className="material-detail-media luxury-card">
                <div className="material-detail-media__frame img-zoom">
                  <SmartImage src={material.image} alt={material.alt || displayMaterialName} className="w-full h-full object-cover" width={900} height={900} loading="eager" sizes="(max-width: 1024px) 92vw, 45vw" candidateWidths={MATERIAL_DETAIL_IMAGE_WIDTHS} quality={74} />
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={120}>
              <div className="subpage-side-panel p-5 md:p-7">
              <span className="text-accent text-xs font-medium uppercase tracking-wider">{displayCategoryName}</span>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-2 mb-4">{displayMaterialName}</h1>
              {isHtmlText(displayMaterialDescription) ? (
                <div className="prose prose-neutral max-w-none text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayMaterialDescription) }} />
              ) : (
                <p className="text-muted-foreground leading-relaxed mb-6">{displayMaterialDescription}</p>
              )}

              <div className="space-y-4 mb-8">
                <div className="material-detail-spec-grid">
                  {[
                    { label: t.type, value: displayMaterialType || material.type },
                    { label: t.color, value: translateDisplayText(material.color || "", language) },
                    { label: t.texture, value: translateDisplayText(material.texture || "", language) },
                    { label: t.category, value: displayCategoryName },
                  ].map((item) => (
                    <div key={item.label} className="luxury-card-muted p-3">
                      <span className="text-xs text-muted-foreground block mb-1">{item.label}</span>
                      <span className="text-sm font-medium">{item.value || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">{t.suitableSpaces}</h3>
                <div className="flex flex-wrap gap-2">
                  {material.suitableSpaces.map((space: string) => (
                    <span key={space} className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground">{translateSpaceLabel(space, language)}</span>
                  ))}
                </div>
              </div>

              {material.recommendedPairing && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">{t.recommendedPairing}</h3>
                  <p className="text-muted-foreground text-sm">{translateDisplayText(material.recommendedPairing, language)}</p>
                </div>
              )}

              {(pros.length > 0 || cons.length > 0) && (
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  {pros.length > 0 && (
                    <div className="luxury-card-muted p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-accent" /> {t.pros}
                      </h3>
                      <ul className="subpage-copy-list subpage-copy-list--compact">
                        {pros.map((item: string) => (
                          <li key={item} className="subpage-copy-item">
                            <span className="subpage-copy-icon">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </span>
                            <span className="subpage-copy-text">{translateDisplayText(item, language)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cons.length > 0 && (
                    <div className="luxury-card-muted p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" /> {t.cons}
                      </h3>
                      <ul className="subpage-copy-list subpage-copy-list--compact">
                        {cons.map((item: string) => (
                          <li key={item} className="subpage-copy-item subpage-copy-item--soft">
                            <span className="subpage-copy-dot" />
                            <span className="subpage-copy-text">{translateDisplayText(item, language)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {material.note && (
                <div className="luxury-card-muted p-4 text-sm text-muted-foreground mb-6">
                  <strong className="text-foreground">{t.note}</strong> {translateDisplayText(material.note, language)}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to={quotePath} className="btn-brand-primary min-h-12 justify-center px-8">
                  {t.enquire} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={settings.whatsapp_url()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand-secondary min-h-12 justify-center px-8"
                >
                  <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
                </a>
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {otherMaterials.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <div className="subpage-local-heading">
              <div className="accent-line mb-4" />
              <h2 className="font-display text-2xl font-bold">{formatText(t.more, { name: displayCategoryName })}</h2>
            </div>
            <div className="card-grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {otherMaterials.map((item) => (
                <article key={item.id} className="material-depth-card luxury-card group hover-lift">
                  <div className="material-depth-card__media img-zoom">
                    <SmartImage src={item.image} alt={item.alt || translateDisplayText(item.name, language)} loading="lazy" width={400} height={400} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 22vw" candidateWidths={MATERIAL_RELATED_IMAGE_WIDTHS} quality={72} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="material-depth-card__body">
                    <h3 className="material-depth-card__title">{translateDisplayText(item.name, language)}</h3>
                    <p className="material-depth-card__meta">{translateMaterialType(item.type, language)} / {translateDisplayText(item.color || displayCategoryName, language)}</p>
                    <div className="material-depth-card__actions">
                      <Link to={`/materials/${item.slug}`} className="material-card-action">
                        {t.view} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default MaterialDetail;
