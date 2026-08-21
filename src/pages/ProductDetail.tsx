import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useParams } from "react-router-dom";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import ImmersiveHero from "@/components/ImmersiveHero";
import ProductDetailChrome from "@/components/ProductDetailChrome";
import ProductGallery from "@/components/ProductGallery";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { usePublishedMaterialBySlug } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory, translateMaterialType, translateSpaceLabel } from "@/i18n/displayLabels";
import { productDetailPageText } from "@/i18n/newClientPageText";
import { trackCtaClick } from "@/lib/analytics";
import { buildQuotePath } from "@/lib/quoteContext";
import { stripHtml } from "@/lib/text";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = productDetailPageText[language];
  const { data, isPending } = usePublishedMaterialBySlug(slug, language);
  const product = data?.material;
  const category = data?.category;

  if (isPending) {
    return <PublicLoadingState label="FLASH CAST" title={t.loadingTitle} description={t.loadingDescription} variant="product" />;
  }

  if (!product || !category) {
    return (
      <main className="new-client-page pt-site-header">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/products/${slug || ""}`} noIndex />
        <section className="site-container py-24 text-center">
          <div className="new-client-empty mx-auto max-w-xl">
            <h1 className="text-3xl font-semibold">{t.notFound}</h1>
            <Button asChild variant="outline" className="mt-6">
              <LocalizedLink to="/products">{t.viewAll}</LocalizedLink>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const displayText = (value?: string) => language === "zh" ? translateDisplayText(value || "", language) : value || "";
  const name = displayText(product.name);
  const description = stripHtml(displayText(product.description));
  const categoryName = translateMaterialCategory(category.name, language);
  const related = category.items.filter((item) => item.slug !== product.slug).slice(0, 4);
  const pros = Array.isArray(product.pros) ? product.pros.filter(Boolean) : [];
  const cons = Array.isArray(product.cons) ? product.cons.filter(Boolean) : [];
  const quotePath = buildQuotePath({
    source: "product",
    title: name,
    projectType: "Other",
    details: language === "zh" ? `我想咨询商品：${name}。` : `I would like to enquire about this product: ${name}.`,
  });
  const specs = [
    { label: t.type, value: translateMaterialType(product.type || "", language) },
    { label: t.color, value: displayText(product.color) },
    { label: t.texture, value: displayText(product.texture) },
  ].filter((item) => item.value);

  return (
    <main className="new-client-page product-detail-page pt-site-header">
      <PageMeta
        title={`${name} | ${t.metaTitleSuffix}`}
        description={`${description} ${t.metaDescriptionSuffix}`}
        keywords={`${name}, ${categoryName}, ${language === "zh" ? "吉隆坡装修商品" : "renovation products Kuala Lumpur"}`}
        canonicalPath={`/products/${product.slug}`}
      />
      <JsonLdBreadcrumb items={[
        { name: t.home, url: "/" },
        { name: t.products, url: "/products" },
        { name, url: `/products/${product.slug}` },
      ]} />

      <ProductDetailChrome
        productName={name}
        description={description}
        backLabel={t.back}
        shareLabel={t.share}
        copiedLabel={t.linkCopied}
        shareFailedLabel={t.shareFailed}
        navigationLabel={t.productActions}
      />

      <ImmersiveHero standardPageHero={false} className="product-detail-opening">
        <div className="product-detail-opening__media">
          <ProductGallery
            images={product.gallery || []}
            fallbackImage={product.image}
            fallbackAlt={product.alt || name}
            navigationLabel={t.galleryLabel}
            positionLabel={t.galleryPosition}
            typeLabels={t.galleryTypes}
          />
        </div>

        <div className="product-detail-opening__copy">
          <p className="new-client-page__eyebrow">{categoryName}</p>
          <h1>{name}</h1>
          {product.referencePrice ? (
            <div className="product-detail-price">
              <span>{t.referencePrice}</span>
              <strong>{product.referencePrice}</strong>
            </div>
          ) : null}
          {product.priceScope ? (
            <p className="product-detail-price-scope"><strong>{t.priceScope}：</strong>{product.priceScope}</p>
          ) : null}
          <p className="product-detail-opening__description">{description}</p>
          <p className="product-detail-price-note">{product.priceNote || t.priceNotice}</p>

          {specs.length ? (
            <dl className="product-detail-quick-specs">
              {specs.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>
          ) : null}

          <div className="product-detail-actions">
            <LocalizedLink
              to={quotePath}
              className="forest-button forest-button--light"
              onClick={() => trackCtaClick("quote", "product_detail", { destination: quotePath })}
            >
              {t.quote} <ArrowRight className="h-4 w-4" />
            </LocalizedLink>
            <a
              href={settings.whatsapp_url()}
              target="_blank"
              rel="noopener noreferrer"
              className="forest-button"
              onClick={() => trackCtaClick("whatsapp", "product_detail", { destination: "whatsapp" })}
            >
              <WhatsAppIcon className="h-4 w-4" /> {t.whatsapp}
            </a>
          </div>
        </div>
      </ImmersiveHero>

      <section className="product-detail-section site-container">
        <header className="product-detail-section__heading">
          <h2>{t.detailsTitle}</h2>
          <p>{t.detailsIntro}</p>
        </header>

        <div className="product-detail-spec-grid">
          <article>
            <h3>{t.suitableSpaces}</h3>
            <div className="product-detail-tags">
              {product.suitableSpaces.length
                ? product.suitableSpaces.map((space) => <span key={space}>{translateSpaceLabel(space, language)}</span>)
                : <p>{t.confirmWithTeam}</p>}
            </div>
          </article>
          <article>
            <h3>{t.recommendedPairing}</h3>
            <p>{displayText(product.recommendedPairing) || t.confirmWithTeam}</p>
          </article>
          <article>
            <h3>{t.confirmationNote}</h3>
            <p>{displayText(product.note) || t.confirmWithTeam}</p>
          </article>
        </div>

        {(pros.length || cons.length) ? (
          <div className="product-detail-considerations">
            {pros.length ? (
              <article>
                <h3><CheckCircle2 className="h-5 w-5" /> {t.advantages}</h3>
                <ul>{pros.map((item) => <li key={item}>{displayText(item)}</li>)}</ul>
              </article>
            ) : null}
            {cons.length ? (
              <article>
                <h3><AlertCircle className="h-5 w-5" /> {t.notes}</h3>
                <ul>{cons.map((item) => <li key={item}>{displayText(item)}</li>)}</ul>
              </article>
            ) : null}
          </div>
        ) : null}
      </section>

      {related.length ? (
        <section className="product-related-section">
          <div className="site-container">
            <header className="product-detail-section__heading">
              <h2>{t.relatedTitle}</h2>
              <p>{t.relatedIntro}</p>
            </header>
            <div className="new-client-grid">
              {related.map((item) => (
                <article key={item.slug} className="new-client-card group">
                  <LocalizedLink to={`/products/${item.slug}`} className="block">
                    <div className="new-client-card__media">
                      <SmartImage src={item.image} alt={item.alt || displayText(item.name)} loading="lazy" width={720} height={720} />
                    </div>
                    <div className="new-client-card__body">
                      <p className="new-client-card__meta">{categoryName}</p>
                      <h3 className="new-client-card__title">{displayText(item.name)}</h3>
                      {item.referencePrice ? <p className="mt-3 text-sm font-semibold">{item.referencePrice}</p> : null}
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">{t.view}<ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </LocalizedLink>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default ProductDetail;
