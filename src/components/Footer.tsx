import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedCtaBlock } from "@/hooks/usePublishedContent";
import SmartImage from "@/components/SmartImage";
import FooterPreludeCta from "@/components/blocks/FooterPreludeCta";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import { stripLanguagePrefix } from "@/i18n/routes";
import logoFallback from "@/assets/logo-flashcast.webp";

const locationLinks = [
  { name: "Kuala Lumpur", slug: "kuala-lumpur" },
  { name: "Petaling Jaya", slug: "petaling-jaya" },
  { name: "Selangor", slug: "selangor" },
  { name: "Mont Kiara", slug: "mont-kiara" },
  { name: "Cheras", slug: "cheras" },
  { name: "Bangsar", slug: "bangsar" },
  { name: "Subang Jaya", slug: "subang-jaya" },
  { name: "Puchong", slug: "puchong" },
];

const locationLinksZh = [
  { name: "吉隆坡", slug: "kuala-lumpur" },
  { name: "八打灵再也", slug: "petaling-jaya" },
  { name: "雪兰莪", slug: "selangor" },
  { name: "满家乐", slug: "mont-kiara" },
  { name: "蕉赖", slug: "cheras" },
  { name: "孟沙", slug: "bangsar" },
  { name: "梳邦再也", slug: "subang-jaya" },
  { name: "蒲种", slug: "puchong" },
];

const footerCopy = {
  en: {
    ctaTitle: "Planning to Renovate Your Home or Office?",
    ctaText: "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    ctaButton: "Get Free Quote",
    brandText:
      "FLASH CAST SDN. BHD. provides residential renovation, commercial fit-out, custom built-in furniture, and premium wall finishing services in Kuala Lumpur and Selangor.",
    trustLine: "SSM Registered / Design, Build & Project Coordination",
    hours: "Mon - Sat / 9:00 AM - 6:00 PM",
    servicesTitle: "Services",
    companyTitle: "Company",
    areasTitle: "Service Areas",
    rights: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    serviceLinks: [
      { name: "Interior Renovation", slug: "renovation" },
      { name: "Custom Built-In Furniture", slug: "builtin" },
      { name: "Commercial Renovation", slug: "commercial" },
      { name: "Artistic Wall Coating", slug: "artistic-coating" },
      { name: "Design Services", slug: "design" },
      { name: "Exterior Works", slug: "exterior" },
      { name: "Warehouse & Shelving", slug: "warehouse" },
    ],
    companyLinks: [
      { name: "About Us", path: "/about" },
      { name: "Projects", path: "/projects" },
      { name: "Materials Library", path: "/materials" },
      { name: "Our Process", path: "/process" },
      { name: "Blog & Guides", path: "/blog" },
      { name: "FAQ", path: "/faq" },
      { name: "Get a Quote", path: "/quote" },
      { name: "Contact Us", path: "/contact" },
    ],
  },
  zh: {
    ctaTitle: "计划装修您的住宅或办公室？",
    ctaText: "立即获取免费咨询和报价。我们服务吉隆坡、雪兰莪及周边地区。",
    ctaButton: "获取免费报价",
    brandText:
      "FLASH CAST SDN. BHD. 专注吉隆坡与雪兰莪住宅装修、商业空间装修、定制内嵌家具和高级墙面涂装服务。",
    trustLine: "SSM 注册公司 / 设计、施工与项目统筹",
    hours: "周一至周六 / 9:00 AM - 6:00 PM",
    servicesTitle: "服务项目",
    companyTitle: "公司信息",
    areasTitle: "服务地区",
    rights: "保留所有权利。",
    privacy: "隐私政策",
    terms: "使用条款",
    serviceLinks: [
      { name: "室内装修", slug: "renovation" },
      { name: "定制内嵌家具", slug: "builtin" },
      { name: "商业空间装修", slug: "commercial" },
      { name: "艺术墙面涂装", slug: "artistic-coating" },
      { name: "设计服务", slug: "design" },
      { name: "外墙与门面工程", slug: "exterior" },
      { name: "仓库与货架工程", slug: "warehouse" },
    ],
    companyLinks: [
      { name: "关于我们", path: "/about" },
      { name: "装修案例", path: "/projects" },
      { name: "材料库", path: "/materials" },
      { name: "施工流程", path: "/process" },
      { name: "装修博客", path: "/blog" },
      { name: "常见问题", path: "/faq" },
      { name: "获取报价", path: "/quote" },
      { name: "联系我们", path: "/contact" },
    ],
  },
};

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="footer-column-title">
    <span aria-hidden />
    <h4>{children}</h4>
  </div>
);

const normalizeFooterServiceLinks = (links: { name: string; slug: string }[], language: "en" | "zh") =>
  links.map((item) => {
    if (item.slug === "commercial") {
      return { ...item, name: language === "zh" ? "办公室装修" : "Office Renovation", slug: "office-renovation" };
    }

    if (item.slug === "exterior") {
      return { ...item, name: language === "zh" ? "店铺装修" : "Shop Renovation", slug: "shop-renovation" };
    }

    return item;
  });

const FooterLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link to={to} className="footer-link">
      {children}
    </Link>
  </li>
);

const MobileAccordion = ({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className={`footer-mobile-panel ${isOpen ? "is-open" : ""}`}>
    <button type="button" onClick={onToggle} aria-expanded={isOpen}>
      <span>{title}</span>
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`footer-mobile-panel-body ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>{children}</div>
  </div>
);

const Footer = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const settings = useSiteSettings();
  const t = footerCopy[language];
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const { data: globalCtaBlock } = usePublishedCtaBlock(language, "home_final");
  const areas = language === "zh" ? locationLinksZh : locationLinks;
  const serviceLinks = normalizeFooterServiceLinks(t.serviceLinks, language);
  const logoSrc = !logoFailed && settings.logo_url ? addCacheBuster(settings.logo_url, settings.updated_at) : logoFallback;
  const normalizedPath = stripLanguagePrefix(location.pathname);
  const hasDedicatedSubpageCta =
    normalizedPath === "/services" ||
    normalizedPath.startsWith("/services/") ||
    normalizedPath === "/projects" ||
    normalizedPath === "/materials" ||
    normalizedPath.startsWith("/materials/category/") ||
    normalizedPath === "/faq" ||
    normalizedPath.startsWith("/landing/");
  const showFooterCta = normalizedPath !== "/" && !hasDedicatedSubpageCta;
  const footerCtaTitle = globalCtaBlock?.title || t.ctaTitle;
  const footerCtaDescription = globalCtaBlock?.description || t.ctaText;
  const footerCtaButton = globalCtaBlock?.primary_label || t.ctaButton;
  const footerCtaPath = globalCtaBlock?.primary_url || "/quote";

  useEffect(() => {
    setLogoFailed(false);
  }, [settings.logo_url, settings.updated_at]);

  const contactItems = [
    { icon: MapPin, text: settings.address, start: true },
    { icon: Phone, text: settings.phone_display },
    { icon: Mail, text: settings.email },
  ];

  return (
    <footer className="site-footer-art">
      {showFooterCta && (
        <FooterPreludeCta
          className="site-footer-prelude"
          eyebrow={language === "zh" ? "项目咨询" : settings.company_name}
          title={footerCtaTitle}
          description={footerCtaDescription}
          quoteLabel={footerCtaButton}
          whatsappLabel={language === "zh" ? "WhatsApp 咨询" : "WhatsApp"}
          quotePath={footerCtaPath}
          whatsappSource="Footer CTA"
        />
      )}

      <div className="footer-surface">
        <div className="footer-content site-container py-10 md:py-16 lg:py-20">
          <div className="footer-workbench hidden lg:grid">
            <div className="footer-brand-panel">
              <div className="footer-logo-row">
                <span className="footer-logo-rule" aria-hidden />
                <div className="footer-logo-card">
                  <SmartImage
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-contain object-left brightness-0 invert opacity-90"
                    width={190}
                    height={48}
                    onError={() => setLogoFailed(true)}
                  />
                  <span className="sr-only">{settings.company_name}</span>
                </div>
              </div>
              <p className="footer-brand-copy">{t.brandText}</p>
              <p className="footer-trust-line">{t.trustLine}</p>

              <div className="footer-contact-list">
                {contactItems.map((item) => (
                  <span key={item.text} className="footer-contact-item">
                    <span>
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{item.text}</span>
                  </span>
                ))}
              </div>

              <p className="footer-hours">{t.hours}</p>
            </div>

            <nav className="footer-link-board" aria-label="Footer navigation">
              <div className="footer-link-column">
                <SectionTitle>{t.servicesTitle}</SectionTitle>
                <ul>
                  {serviceLinks.map((item) => (
                    <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </div>

              <div className="footer-link-column">
                <SectionTitle>{t.companyTitle}</SectionTitle>
                <ul>
                  {t.companyLinks.map((item) => (
                    <FooterLink key={item.path} to={item.path}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </div>

              <div className="footer-link-column">
                <SectionTitle>{t.areasTitle}</SectionTitle>
                <div className="footer-area-chips">
                  {areas.map((area) => (
                    <Link key={area.slug} to={`/locations/${area.slug}`}>
                      {area.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <div className="footer-mobile-stack lg:hidden">
            <section className="footer-brand-panel footer-brand-panel-mobile">
              <div className="footer-logo-row">
                <span className="footer-logo-rule" aria-hidden />
                <div className="footer-logo-card">
                  <SmartImage
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-contain object-left brightness-0 invert opacity-90"
                    width={170}
                    height={44}
                    onError={() => setLogoFailed(true)}
                  />
                  <span className="sr-only">{settings.company_name}</span>
                </div>
              </div>
              <p className="footer-brand-copy">{t.brandText}</p>
              <p className="footer-trust-line">{t.trustLine}</p>
              <div className="footer-contact-list">
                {contactItems.map((item) => (
                  <span key={item.text} className="footer-contact-item">
                    <span>
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{item.text}</span>
                  </span>
                ))}
              </div>
              <p className="footer-hours">{t.hours}</p>
            </section>

            <div className="footer-mobile-nav">
              <MobileAccordion
                title={t.servicesTitle}
                isOpen={openSection === "services"}
                onToggle={() => setOpenSection(openSection === "services" ? null : "services")}
              >
                <ul className="footer-mobile-link-list">
                  {serviceLinks.map((item) => (
                    <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </MobileAccordion>

              <MobileAccordion
                title={t.companyTitle}
                isOpen={openSection === "company"}
                onToggle={() => setOpenSection(openSection === "company" ? null : "company")}
              >
                <ul className="footer-mobile-link-list">
                  {t.companyLinks.map((item) => (
                    <FooterLink key={item.path} to={item.path}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </MobileAccordion>

              <MobileAccordion
                title={t.areasTitle}
                isOpen={openSection === "areas"}
                onToggle={() => setOpenSection(openSection === "areas" ? null : "areas")}
              >
                <div className="footer-area-chips">
                  {areas.map((area) => (
                    <Link key={area.slug} to={`/locations/${area.slug}`}>
                      {area.name}
                    </Link>
                  ))}
                </div>
              </MobileAccordion>
            </div>
          </div>

          <div className="footer-legal">
            <p>© {new Date().getFullYear()} {settings.company_name} {t.rights}</p>
            <div>
              <Link to="/privacy">
                {t.privacy}
              </Link>
              <Link to="/terms">
                {t.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
