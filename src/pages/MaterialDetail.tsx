import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { usePublishedMaterialBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateMaterialCategory, translateMaterialType, translateSpaceLabel } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Material Not Found",
    viewAll: "View All Materials",
    breadcrumbHome: "Home",
    breadcrumbMaterials: "Materials",
    metaTitle: (name: string) => `${name} | Renovation Material in Kuala Lumpur`,
    metaDescription: (description: string, spaces: string[]) => `${stripHtml(description)} Suitable for: ${spaces.join(", ")}. Available at FLASH CAST, Kuala Lumpur.`,
    metaKeywords: (name: string, category: string) => `${name}, ${category} KL, renovation material Malaysia`,
    type: "Type",
    color: "Color",
    texture: "Texture",
    category: "Category",
    suitableSpaces: "Suitable Spaces",
    recommendedPairing: "Recommended Pairing",
    note: "Note:",
    enquire: "Enquire About This Material",
    whatsapp: "WhatsApp",
    more: (name: string) => `More ${name}`,
  },
  zh: {
    notFound: "材料不存在",
    viewAll: "查看全部材料",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    metaTitle: (name: string) => `${name} | 吉隆坡装修材料`,
    metaDescription: (description: string, spaces: string[]) => `${stripHtml(description)} 适用空间：${spaces.join("、")}。可向 FLASH CAST 咨询材料搭配和报价。`,
    metaKeywords: (name: string, category: string) => `${name}, ${category} 吉隆坡, 马来西亚装修材料`,
    type: "类型",
    color: "颜色",
    texture: "质感",
    category: "分类",
    suitableSpaces: "适用空间",
    recommendedPairing: "推荐搭配",
    note: "备注：",
    enquire: "咨询此材料",
    whatsapp: "WhatsApp 咨询",
    more: (name: string) => `更多 ${name}`,
  },
};

const MaterialDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];

  let fallbackMaterial = null;
  let fallbackCategory = null;
  for (const categoryItem of materialsData) {
    const found = categoryItem.items.find((materialItem) => materialItem.slug === slug);
    if (found) {
      fallbackMaterial = found;
      fallbackCategory = categoryItem;
      break;
    }
  }

  const { data: published } = usePublishedMaterialBySlug(slug, language);
  const material = published?.material ?? fallbackMaterial;
  const category = published?.category ?? fallbackCategory;
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const displayMaterialType = material ? translateMaterialType(material.type || "", language) : "";

  if (!material || !category) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/materials">{t.viewAll}</Link></Button>
      </main>
    );
  }

  const otherMaterials = category.items.filter((item: any) => item.slug !== slug);

  return (
    <main className="pt-16">
      <PageMeta
        title={t.metaTitle(material.name)}
        description={t.metaDescription(material.description, material.suitableSpaces.map((space: string) => translateSpaceLabel(space, language)))}
        keywords={t.metaKeywords(material.name, displayCategoryName)}
        canonicalPath={`/materials/${material.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }, { name: material.name, url: `/materials/${material.slug}` }]} />

      <section className="bg-muted px-4 md:px-8 py-3">
        <div className="container-narrow flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/materials" className="hover:text-accent">{t.breadcrumbMaterials}</Link>
          <span>/</span>
          <Link to={`/materials/category/${category.slug}`} className="hover:text-accent">{displayCategoryName}</Link>
          <span>/</span>
          <span className="text-foreground">{material.name}</span>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
              <SmartImage src={material.image} alt={material.alt || material.name} className="w-full h-full object-cover" width={800} height={600} loading="eager" />
            </div>

            <div>
              <span className="text-accent text-xs font-medium uppercase tracking-wider">{displayCategoryName}</span>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-2 mb-4">{material.name}</h1>
              {isHtmlText(material.description) ? (
                <div className="prose prose-neutral max-w-none text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(material.description) }} />
              ) : (
                <p className="text-muted-foreground leading-relaxed mb-6">{material.description}</p>
              )}

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t.type, value: displayMaterialType || material.type },
                    { label: t.color, value: material.color },
                    { label: t.texture, value: material.texture },
                    { label: t.category, value: displayCategoryName },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-muted rounded-lg">
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
                  <p className="text-muted-foreground text-sm">{material.recommendedPairing}</p>
                </div>
              )}

              {material.note && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground mb-6">
                  <strong className="text-foreground">{t.note}</strong> {material.note}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/quote">{t.enquire} <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {otherMaterials.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <h2 className="font-display text-2xl font-bold mb-6">{t.more(displayCategoryName)}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
              {otherMaterials.map((item: any) => (
                <Link key={item.id} to={`/materials/${item.slug}`} className="snap-start shrink-0 w-[180px] md:w-[220px] group">
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-card border border-border">
                    <SmartImage src={item.image} alt={item.alt || item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs">{translateMaterialType(item.type, language)} / {item.color || displayCategoryName}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default MaterialDetail;
