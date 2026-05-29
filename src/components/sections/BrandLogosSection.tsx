import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { usePublishedBrandPartners } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";

const copy = {
  en: {
    eyebrow: "Partners",
    title: "Brands and materials we work with",
  },
  zh: {
    eyebrow: "合作品牌",
    title: "常用品牌与材料伙伴",
  },
};

const BrandLogosSection = () => {
  const { language } = useLanguage();
  const { data: publishedBrands } = usePublishedBrandPartners();
  const items = publishedBrands?.filter((item) => item.logo_url && item.name) ?? [];
  const t = copy[language];

  if (!items.length) return null;

  return (
    <section className="section-padding bg-background" id="brand-partners">
      <div className="container-narrow">
        <Reveal>
          <div className="mb-8 text-center md:mb-10">
            <div className="accent-line mx-auto mb-4" />
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-accent">{t.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold md:text-3xl">{t.title}</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, index) => {
            const logo = (
              <div className="flex h-24 items-center justify-center rounded-card border border-border/80 bg-card p-4 shadow-[0_18px_44px_-40px_rgba(21,18,14,0.38)] transition hover:-translate-y-0.5 hover:border-accent/30">
                <SmartImage
                  src={item.logo_url}
                  alt={item.name}
                  className="max-h-14 w-full object-contain"
                  width={220}
                  height={96}
                  loading={index < 6 ? "eager" : "lazy"}
                  resize="contain"
                />
              </div>
            );

            return (
              <Reveal key={item.id || item.name} delay={index * 40}>
                {item.website_url ? (
                  <a href={item.website_url} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
