import { ReactNode, useState } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight, ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SmartImage from "@/components/SmartImage";
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
    ctaTitle: "Ready to Plan Your Renovation?",
    ctaText: "Talk to FLASH CAST about your space, budget, timeline, and renovation scope.",
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
    ctaTitle: "准备开始装修规划？",
    ctaText: "把空间、预算、工期和需求告诉 FLASH CAST，我们会给你清楚的装修建议。",
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
  <div className="mb-5 flex items-center gap-3">
    <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_0_5px_hsl(var(--gold)/0.12)]" aria-hidden />
    <h4 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">{children}</h4>
  </div>
);

const FooterLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link to={to} className="text-[13px] leading-relaxed text-white/60 transition-colors duration-200 hover:text-gold">
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
  <div className="border-b border-white/[0.08]">
    <button type="button" onClick={onToggle} className="flex min-h-12 w-full items-center justify-between py-4">
      <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/80">{title}</span>
      <ChevronDown className={`h-4 w-4 text-gold/75 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>{children}</div>
  </div>
);

const Footer = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = footerCopy[language];
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const areas = language === "zh" ? locationLinksZh : locationLinks;
  const logoSrc = !logoFailed && settings.logo_url ? settings.logo_url : logoFallback;

  const contactItems = [
    { icon: MapPin, text: settings.address, start: true },
    { icon: Phone, text: settings.phone_display },
    { icon: Mail, text: settings.email },
  ];

  return (
    <footer>
      <div className="footer-cta-bar hidden md:block">
        <div className="site-container flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:py-14 md:text-left">
          <div className="min-w-0">
            <h3 className="heading-safe font-display text-2xl font-bold text-surface-dark-foreground md:text-3xl">{t.ctaTitle}</h3>
            <p className="mt-2 text-sm text-surface-dark-foreground/75 md:text-base">{t.ctaText}</p>
          </div>
          <Link to="/quote" className="btn-on-dark-primary btn-press w-full shrink-0 md:w-auto">
            {t.ctaButton} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="footer-surface">
        <div className="site-container py-12 md:py-20">
          <div className="hidden grid-cols-12 gap-10 lg:grid">
            <div className="col-span-4 pr-4">
              <div className="mb-6 inline-flex h-12 w-48 items-center overflow-hidden">
                <SmartImage
                  src={logoSrc}
                  alt=""
                  className="h-full w-full object-contain object-left brightness-0 invert opacity-80"
                  width={190}
                  height={48}
                  onError={() => setLogoFailed(true)}
                />
                <span className="sr-only">{settings.company_name}</span>
              </div>
              <p className="mb-3 max-w-[360px] text-sm leading-relaxed text-white/70">{t.brandText}</p>
              <p className="mb-8 max-w-[360px] text-xs text-white/50">{t.trustLine}</p>

              <div className="mb-5 flex flex-col gap-4 text-sm text-white/60">
                {contactItems.map((item) => (
                  <span key={item.text} className={`group flex gap-3 ${item.start ? "items-start" : "items-center"}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.05] transition-colors group-hover:border-gold/30">
                      <item.icon className="h-3.5 w-3.5 text-gold" />
                    </span>
                    <span className="pt-1.5 leading-relaxed">{item.text}</span>
                  </span>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{t.hours}</p>
            </div>

            <div className="col-span-2">
              <SectionTitle>{t.servicesTitle}</SectionTitle>
              <ul className="space-y-3">
                {t.serviceLinks.map((item) => (
                  <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                    {item.name}
                  </FooterLink>
                ))}
              </ul>
            </div>

            <div className="col-span-2">
              <SectionTitle>{t.companyTitle}</SectionTitle>
              <ul className="space-y-3">
                {t.companyLinks.map((item) => (
                  <FooterLink key={item.path} to={item.path}>
                    {item.name}
                  </FooterLink>
                ))}
              </ul>
            </div>

            <div className="col-span-4">
              <SectionTitle>{t.areasTitle}</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/locations/${area.slug}`}
                    className="rounded-full border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            <div className="mb-2 border-b border-white/[0.08] pb-5">
              <div className="mb-4 inline-flex h-11 w-[10.5rem] items-center overflow-hidden">
                <SmartImage
                  src={logoSrc}
                  alt=""
                  className="h-full w-full object-contain object-left brightness-0 invert opacity-80"
                  width={170}
                  height={44}
                  onError={() => setLogoFailed(true)}
                />
                <span className="sr-only">{settings.company_name}</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/70">{t.brandText}</p>
              <div className="space-y-3 text-sm text-white/70">
                {contactItems.map((item) => (
                  <span key={item.text} className={`flex gap-3 ${item.start ? "items-start" : "items-center"}`}>
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span className="leading-relaxed">{item.text}</span>
                  </span>
                ))}
              </div>
            </div>

            <MobileAccordion title={t.servicesTitle} isOpen={openSection === "services"} onToggle={() => setOpenSection(openSection === "services" ? null : "services")}>
              <ul className="space-y-3">
                {t.serviceLinks.map((item) => (
                  <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                    {item.name}
                  </FooterLink>
                ))}
              </ul>
            </MobileAccordion>

            <MobileAccordion title={t.companyTitle} isOpen={openSection === "company"} onToggle={() => setOpenSection(openSection === "company" ? null : "company")}>
              <ul className="space-y-3">
                {t.companyLinks.map((item) => (
                  <FooterLink key={item.path} to={item.path}>
                    {item.name}
                  </FooterLink>
                ))}
              </ul>
            </MobileAccordion>

            <MobileAccordion title={t.areasTitle} isOpen={openSection === "areas"} onToggle={() => setOpenSection(openSection === "areas" ? null : "areas")}>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/locations/${area.slug}`}
                    className="rounded-full border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </MobileAccordion>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/[0.1] pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} {settings.company_name} {t.rights}</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="transition-colors hover:text-white">
                {t.privacy}
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
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
