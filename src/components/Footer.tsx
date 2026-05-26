import { ReactNode, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, ArrowRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig } from "@/config/site";
import logoImg from "@/assets/logo-flashcast.png";

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
  { name: "Mont Kiara", slug: "mont-kiara" },
  { name: "蕉赖", slug: "cheras" },
  { name: "Bangsar", slug: "bangsar" },
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
    ctaText: "立即获取免费咨询与装修报价。让我们一起打造理想空间。",
    ctaButton: "获取免费报价",
    brandText:
      "FLASH CAST 是位于吉隆坡的专业装修与室内设计公司，专注住宅装修、定制内嵌家具、商业空间装修以及德国 Remmers 艺术墙面涂装。",
    trustLine: "SSM 注册 / 自有设计与施工团队",
    hours: "周一至周六 / 9:00 AM - 6:00 PM",
    servicesTitle: "服务项目",
    companyTitle: "公司",
    areasTitle: "服务区域",
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
    <h4 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">
      {children}
    </h4>
    <div className="w-6 h-px bg-[hsl(var(--gold))] mt-3" />
  </div>
);

const FooterLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link
      to={to}
      className="text-[13px] text-white/40 hover:text-[hsl(var(--gold))] transition-colors duration-200"
    >
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
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-5 px-1"
    >
      <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">
        {title}
      </span>
      <ChevronDown
        className={`w-4 h-4 text-[hsl(var(--gold))]/60 transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>
      {children}
    </div>
  </div>
);

const Footer = () => {
  const { language } = useLanguage();
  const t = footerCopy[language];
  const [openSection, setOpenSection] = useState<string | null>(null);
  const areas = language === "zh" ? locationLinksZh : locationLinks;

  const contactItems = [
    { icon: MapPin, text: "94, Jalan Mega Mendung, Taman United, 58200 KL", start: true },
    { icon: Phone, text: siteConfig.phoneDisplay },
    { icon: Mail, text: siteConfig.email },
  ];

  return (
    <footer>
      <div className="bg-accent">
        <div className="container-narrow px-5 md:px-8 lg:px-16 py-10 md:py-14 flex flex-col items-center text-center md:text-left md:flex-row md:justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-accent-foreground">
              {t.ctaTitle}
            </h3>
            <p className="text-accent-foreground/70 mt-2 text-sm md:text-base">
              {t.ctaText}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full md:w-auto bg-white text-accent hover:bg-white/90 font-semibold px-8 btn-press shrink-0"
          >
            <Link to="/quote" className="flex items-center justify-center gap-2">
              {t.ctaButton} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-[hsl(220,20%,7%)]">
        <div className="container-narrow px-5 md:px-8 lg:px-16 py-12 md:py-20">
          <div className="hidden lg:grid grid-cols-12 gap-10">
            <div className="col-span-4 pr-4">
              <div className="mb-6">
                <img src={logoImg} alt="FLASH CAST" className="h-10 w-auto brightness-0 invert opacity-90" />
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-3 max-w-[300px]">
                {t.brandText}
              </p>
              <p className="text-xs text-white/25 mb-8 max-w-[300px]">
                {t.trustLine}
              </p>

              <div className="flex flex-col gap-4 text-sm text-white/45 mb-4">
                {contactItems.map((item) => (
                  <span key={item.text} className={`flex ${item.start ? "items-start" : "items-center"} gap-3 group`}>
                    <span className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[hsl(var(--gold)/0.3)] transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
                    </span>
                    <span className="pt-1.5">{item.text}</span>
                  </span>
                ))}
              </div>

              <p className="text-[11px] tracking-[0.12em] uppercase text-white/20">
                {t.hours}
              </p>
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
                    className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] border border-white/[0.06] text-white/55 hover:text-[hsl(var(--gold))] hover:border-[hsl(var(--gold)/0.25)] transition-colors"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:hidden flex flex-col gap-2">
            <div className="pb-3 mb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImg} alt="FLASH CAST" className="h-9 w-auto brightness-0 invert opacity-90" />
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-3">
                {t.brandText}
              </p>
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
                    className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] border border-white/[0.06] text-white/55 hover:text-[hsl(var(--gold))] hover:border-[hsl(var(--gold)/0.25)] transition-colors"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </MobileAccordion>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/25">
            <p>© {new Date().getFullYear()} FLASH CAST SDN. BHD. {t.rights}</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">
                {t.privacy}
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
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
