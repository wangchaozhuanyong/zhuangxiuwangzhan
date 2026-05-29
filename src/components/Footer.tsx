import { ReactNode, useState } from "react";
import Link from "@/components/LocalizedLink";
import { MapPin, Phone, Mail, ArrowRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SmartImage from "@/components/SmartImage";

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
    ctaTitle: "Ready to Transform Your Space?",
    ctaText: "Get a free consultation and quote for your dream renovation.",
    ctaButton: "Get Free Quote",
    brandText:
      "Professional renovation and interior design company in Kuala Lumpur, Malaysia. Specializing in residential renovation, custom built-in furniture, commercial fit-out, and artistic wall coating (German Remmers).",
    trustLine: "SSM Registered / In-House Design & Build Team",
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
    ctaTitle: "准备好改造您的空间了吗？",
    ctaText: "立即获取免费咨询与报价，让我们一起打造理想空间。",
    ctaButton: "获取免费报价",
    brandText:
      "FLASH CAST 是一家位于马来西亚吉隆坡的专业装修与室内设计公司，专注住宅装修、定制内嵌家具、商业空间装潢，以及德国 Remmers 艺术墙面涂装。",
    trustLine: "SSM 注册 / 自有设计与施工团队",
    hours: "周一至周六 / 9:00 AM - 6:00 PM",
    servicesTitle: "服务项目",
    companyTitle: "公司",
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
  <div className="mb-6">
    <h4 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">{children}</h4>
    <div className="mt-3 h-px w-6 bg-[hsl(var(--gold))]" />
  </div>
);

const FooterLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link to={to} className="text-[13px] text-white/40 transition-colors duration-200 hover:text-[hsl(var(--gold))]">
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
  <div className="border-b border-white/[0.06]">
    <button type="button" onClick={onToggle} className="flex min-h-12 w-full items-center justify-between px-1 py-4">
      <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">{title}</span>
      <ChevronDown className={`h-4 w-4 text-[hsl(var(--gold))]/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>{children}</div>
  </div>
);

const Footer = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = footerCopy[language];
  const [openSection, setOpenSection] = useState<string | null>(null);
  const areas = language === "zh" ? locationLinksZh : locationLinks;

  const contactItems = [
    { icon: MapPin, text: settings.short_address || settings.address, start: true },
    { icon: Phone, text: settings.phone_display },
    { icon: Mail, text: settings.email },
  ];

  return (
    <footer>
      <div className="footer-cta-bar">
        <div className="site-container flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:py-14 md:text-left">
          <div className="min-w-0">
            <h3 className="heading-safe font-display text-2xl font-bold text-surface-dark-foreground md:text-3xl">{t.ctaTitle}</h3>
            <p className="mt-2 text-sm text-surface-dark-foreground/70 md:text-base">{t.ctaText}</p>
          </div>
          <Link to="/quote" className="btn-on-dark-primary btn-press w-full shrink-0 md:w-auto">
            {t.ctaButton} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="footer-surface">
        <div className="site-container py-12 md:py-20">
          <div className="hidden gap-10 lg:grid grid-cols-12">
            <div className="col-span-4 pr-4">
              <div className="mb-6">
                <SmartImage src={settings.logo_url} alt={settings.company_name} className="h-10 w-auto opacity-90" width={160} height={40} />
              </div>
              <p className="mb-3 max-w-[300px] text-sm leading-relaxed text-white/40">{t.brandText}</p>
              <p className="mb-8 max-w-[300px] text-xs text-white/25">{t.trustLine}</p>

              <div className="mb-4 flex flex-col gap-4 text-sm text-white/45">
                {contactItems.map((item) => (
                  <span key={item.text} className={`group flex gap-3 ${item.start ? "items-start" : "items-center"}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] transition-colors group-hover:border-[hsl(var(--gold)/0.3)]">
                      <item.icon className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
                    </span>
                    <span className="pt-1.5">{item.text}</span>
                  </span>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-[0.12em] text-white/20">{t.hours}</p>
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
                    className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition-colors hover:border-[hsl(var(--gold)/0.25)] hover:text-[hsl(var(--gold))]"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            <div className="mb-2 border-b border-white/[0.08] pb-3">
              <div className="mb-4 flex items-center gap-3">
                <SmartImage src={settings.logo_url} alt={settings.company_name} className="h-9 w-auto opacity-90" width={144} height={36} />
              </div>
              <p className="mb-3 text-sm leading-relaxed text-white/40">{t.brandText}</p>
            </div>

            <MobileAccordion
              title={t.servicesTitle}
              isOpen={openSection === "services"}
              onToggle={() => setOpenSection(openSection === "services" ? null : "services")}
            >
              <ul className="space-y-3">
                {t.serviceLinks.map((item) => (
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
              <ul className="space-y-3">
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
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/locations/${area.slug}`}
                    className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition-colors hover:border-[hsl(var(--gold)/0.25)] hover:text-[hsl(var(--gold))]"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </MobileAccordion>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-6 text-xs text-white/25 sm:flex-row sm:items-center">
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
