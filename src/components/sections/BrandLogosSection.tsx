import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { usePublishedBrandPartners } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";

const copy = {
  en: {
    eyebrow: "Common Brands",
    title: "Curated Materials & Hardware Partners",
    subtitle:
      "We select suitable materials, fittings, and hardware for residential, commercial, built-in furniture, and wall finishing projects.",
    fallbackCategory: "Material option",
  },
  zh: {
    eyebrow: "常用品牌",
    title: "甄选材料与五金品牌",
    subtitle: "我们根据项目预算、风格和施工需求，选用适合住宅、商业空间、定制家具与墙面系统的材料和五金。",
    fallbackCategory: "可选材料品牌",
  },
};

const brandCategories = [
  { test: /blum/i, en: "Cabinet hardware", zh: "定制柜五金" },
  { test: /h[aä]fele|hafele/i, en: "Hardware systems", zh: "五金系统" },
  { test: /hettich/i, en: "Furniture fittings", zh: "家具五金" },
  { test: /remmers/i, en: "Wood protection", zh: "木作保护" },
  { test: /nippon|jotun|dulux/i, en: "Wall coatings", zh: "墙面涂料" },
  { test: /grohe/i, en: "Bath fittings", zh: "卫浴龙头" },
  { test: /kohler|toto/i, en: "Bathroom fixtures", zh: "卫浴洁具" },
  { test: /bosch|makita|hilti/i, en: "Tool systems", zh: "工具系统" },
] as const;

const getBrandCategory = (name: string, language: "en" | "zh", fallback: string) => {
  const match = brandCategories.find((item) => item.test.test(name));
  return match ? match[language] : fallback;
};

const BrandLogosSection = () => {
  const { language } = useLanguage();
  const { data: publishedBrands } = usePublishedBrandPartners();
  const items = publishedBrands?.filter((item) => item.logo_url && item.name) ?? [];
  const t = copy[language];

  if (!items.length) return null;

  return (
    <section className="section-padding brand-board-section" id="brand-partners">
      <div className="container-narrow brand-board-inner">
        <Reveal>
          <div className="brand-board-header">
            <span className="brand-board-mark" aria-hidden />
            <p className="brand-board-eyebrow">{t.eyebrow}</p>
            <h2 className="brand-board-title font-display">{t.title}</h2>
            <p className="brand-board-subtitle">{t.subtitle}</p>
          </div>
        </Reveal>

        <div className="brand-board-grid">
          {items.map((item, index) => {
            const category = getBrandCategory(item.name, language, t.fallbackCategory);
            const logo = (
              <div className="brand-board-card">
                <div className="brand-board-logo-frame">
                  <SmartImage
                    src={item.logo_url}
                    alt={item.name}
                    className="brand-board-logo"
                    width={260}
                    height={120}
                    loading={index < 8 ? "eager" : "lazy"}
                    resize="contain"
                  />
                </div>
                <div className="brand-board-copy">
                  <p className="brand-board-name">{item.name}</p>
                  <p className="brand-board-category">{category}</p>
                </div>
              </div>
            );

            return (
              <Reveal key={item.id || item.name} delay={index * 40} className="brand-board-item">
                {item.website_url ? (
                  <a className="brand-board-link" href={item.website_url} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
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
