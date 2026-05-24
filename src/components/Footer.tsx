import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Instagram, ArrowRight, ChevronDown } from "lucide-react";
import logoImg from "@/assets/logo-flashcast.png";

/* Custom SVG icons */
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.16 8.16 0 004.76 1.53V6.79a4.85 4.85 0 01-1-.1z" />
  </svg>
);

const XiaohongshuIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M15.23 6h-1.09L13.2 9.38h1.53l.2-.98h1.2l.22.98h1.53L16.87 6h-1.64zm-.13 1.63l.33 1.1h-.82l.49-1.1zM5.23 6L3.7 9.38h1.56l.28-.72h1.5l.24.72h1.56L7.35 6H5.23zm.63 1.22l.42 1.1H5.4l.46-1.1zM10.5 6H8.84v3.38h1.56V7.76l.97 1.62h.13l.97-1.62v1.62h1.56V6h-1.66l-.94 1.56L10.5 6zM3 11.5v1.12h2.38v3.88H3v1.12h7v-1.12H6.88V12.62H10v-1.12H3zM14.5 11.5v1.12h-1.25v4.88h1.25v.12h-1.25V18.75h1.25v1.12H11v-1.12h1.25V17.62H11v-.12h1.25V12.62H11V11.5h3.5zM17.5 11.5v6.12H21v1.12h-5V11.5h1.5zm0 1.12v1.76H20v1.12h-2.5v1h2.5v1.12h-2.5z" />
  </svg>
);

const locationLinks = [
  { name: "Kuala Lumpur", slug: "kuala-lumpur" },
  { name: "Petaling Jaya", slug: "petaling-jaya" },
  { name: "Selangor", slug: "selangor" },
  { name: "Mont Kiara", slug: "mont-kiara" },
  { name: "Cheras", slug: "cheras" },
  { name: "Bangsar", slug: "bangsar" },
  { name: "Subang Jaya", slug: "subang-jaya" },
];

const serviceLinks = [
  { name: "Interior Renovation", slug: "renovation" },
  { name: "Custom Built-In Furniture", slug: "builtin" },
  { name: "Commercial Renovation", slug: "commercial" },
  { name: "Artistic Wall Coating", slug: "artistic-coating" },
  { name: "Design Services", slug: "design" },
  { name: "Exterior Works", slug: "exterior" },
  { name: "Warehouse & Shelving", slug: "warehouse" },
];

const companyLinks = [
  { name: "About Us", path: "/about" },
  { name: "Projects", path: "/projects" },
  { name: "Materials Library", path: "/materials" },
  { name: "Our Process", path: "/process" },
  { name: "Blog & Guides", path: "/blog" },
  { name: "FAQ", path: "/faq" },
  { name: "Get a Quote", path: "/quote" },
  { name: "Contact Us", path: "/contact" },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h4 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">
      {children}
    </h4>
    <div className="w-6 h-px bg-[hsl(var(--gold))] mt-3" />
  </div>
);

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
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
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="border-b border-white/[0.06]">
    <button
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
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? "max-h-96 pb-5" : "max-h-0"
      }`}
    >
      {children}
    </div>
  </div>
);

/* Social links — hidden until real URLs are provided */
const socialLinks: { icon: React.FC<{className?: string}>; label: string; href: string; hoverBg: string; activeStyle: string }[] = [
  // Uncomment and update with real URLs when available:
  // { icon: TikTokIcon, label: "TikTok", href: "https://tiktok.com/@flashcast", hoverBg: "hover:bg-white hover:text-black hover:border-white", activeStyle: "active:bg-white active:text-black active:border-white" },
  // { icon: Instagram, label: "Instagram", href: "https://instagram.com/flashcast", hoverBg: "hover:bg-gradient-to-br hover:from-[#f09433] hover:to-[#bc1888] hover:text-white hover:border-transparent", activeStyle: "active:bg-[#bc1888] active:text-white active:border-transparent" },
  // { icon: XiaohongshuIcon, label: "Xiaohongshu", href: "https://xiaohongshu.com/flashcast", hoverBg: "hover:bg-[#FF2442] hover:text-white hover:border-[#FF2442]", activeStyle: "active:bg-[#FF2442] active:text-white active:border-[#FF2442]" },
];

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <footer>
      {/* CTA Band */}
      <div className="bg-accent">
        <div className="container-narrow px-5 md:px-8 lg:px-16 py-10 md:py-14 flex flex-col items-center text-center md:text-left md:flex-row md:justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-accent-foreground">
              Ready to Transform Your Space?
            </h3>
            <p className="text-accent-foreground/70 mt-2 text-sm md:text-base">
              Get a free consultation and quote for your dream renovation.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full md:w-auto bg-white text-accent hover:bg-white/90 font-semibold px-8 btn-press shrink-0"
          >
            <Link to="/quote" className="flex items-center justify-center gap-2">
              Get Free Quote <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[hsl(220,20%,7%)]">
        <div className="container-narrow px-5 md:px-8 lg:px-16 py-12 md:py-20">

          {/* Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-10">
            {/* Brand */}
            <div className="col-span-4 pr-4">
              <div className="mb-6">
                <img src={logoImg} alt="FLASH CAST" className="h-10 w-auto brightness-0 invert opacity-90" />
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-3 max-w-[300px]">
                Professional renovation & interior design company in Kuala Lumpur, Malaysia. Specializing in residential renovation, custom built-in furniture, commercial fit-out, and artistic wall coating (German Remmers).
              </p>
              <p className="text-xs text-white/25 mb-8 max-w-[300px]">
                SSM Registered · In-House Design & Build Team
              </p>

              <div className="flex flex-col gap-4 text-sm text-white/45 mb-4">
                {[
                  { icon: MapPin, text: "94, Jalan Mega Mendung, Taman United, 58200 KL", start: true },
                  { icon: Phone, text: "+60 12-345 6789" },
                  { icon: Mail, text: "info@flashcast.com.my" },
                ].map((item) => (
                  <span key={item.text} className={`flex ${item.start ? 'items-start' : 'items-center'} gap-3 group`}>
                    <span className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[hsl(var(--gold)/0.3)] transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
                    </span>
                    <span className="pt-1.5">{item.text}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/25 mb-8">Mon – Sat · 9:00 AM – 6:00 PM</p>

              {/* Social icons */}
              <div className="flex gap-3">
                {socialLinks.map(({ icon: Icon, label, href, hoverBg }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className={`w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/35 ${hoverBg} transition-all duration-300`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="col-span-2 col-start-6">
              <SectionTitle>Services</SectionTitle>
              <ul className="space-y-3">
                {serviceLinks.map((s) => (
                  <FooterLink key={s.slug} to={`/services/${s.slug}`}>{s.name}</FooterLink>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="col-span-2">
              <SectionTitle>Company</SectionTitle>
              <ul className="space-y-3">
                {companyLinks.map((c) => (
                  <FooterLink key={c.path} to={c.path}>{c.name}</FooterLink>
                ))}
              </ul>
            </div>

            {/* Service Areas */}
            <div className="col-span-2">
              <SectionTitle>Service Areas</SectionTitle>
              <ul className="space-y-3">
                {locationLinks.map((loc) => (
                  <FooterLink key={loc.slug} to={`/locations/${loc.slug}`}>{loc.name}</FooterLink>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="flex flex-col items-center mb-10">
              <img src={logoImg} alt="FLASH CAST" className="h-9 w-auto brightness-0 invert opacity-90 mb-5" />
              <p className="text-sm text-white/40 leading-relaxed mb-2 max-w-[280px] text-center">
                Professional renovation & interior design company in Kuala Lumpur, Malaysia.
              </p>
              <p className="text-xs text-white/25 mb-7 text-center">SSM Registered · Mon–Sat 9AM–6PM</p>

              <div className="flex flex-col gap-4 text-sm text-white/45 mb-7 w-full max-w-[280px]">
                {[
                  { icon: MapPin, text: "94, Jalan Mega Mendung, Taman United, 58200 KL", start: true },
                  { icon: Phone, text: "+60 12-345 6789" },
                  { icon: Mail, text: "info@flashcast.com.my" },
                ].map((item) => (
                  <span key={item.text} className={`flex ${item.start ? 'items-start' : 'items-center'} gap-3`}>
                    <span className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[hsl(var(--gold))]" />
                    </span>
                    <span className="pt-2 text-left">{item.text}</span>
                  </span>
                ))}
              </div>

              {/* Social icons */}
              <div className="flex gap-4">
                {socialLinks.map(({ icon: Icon, label, href, activeStyle }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className={`w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-white/35 ${activeStyle} transition-all duration-200`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Accordion */}
            <div className="border-t border-white/[0.06]">
              <MobileAccordion title="Services" isOpen={openSection === "services"} onToggle={() => toggleSection("services")}>
                <ul className="space-y-3 px-1">
                  {serviceLinks.map((s) => (
                    <FooterLink key={s.slug} to={`/services/${s.slug}`}>{s.name}</FooterLink>
                  ))}
                </ul>
              </MobileAccordion>
              <MobileAccordion title="Company" isOpen={openSection === "company"} onToggle={() => toggleSection("company")}>
                <ul className="space-y-3 px-1">
                  {companyLinks.map((c) => (
                    <FooterLink key={c.path} to={c.path}>{c.name}</FooterLink>
                  ))}
                </ul>
              </MobileAccordion>
              <MobileAccordion title="Service Areas" isOpen={openSection === "areas"} onToggle={() => toggleSection("areas")}>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-3 px-1">
                  {locationLinks.map((loc) => (
                    <FooterLink key={loc.slug} to={`/locations/${loc.slug}`}>{loc.name}</FooterLink>
                  ))}
                </ul>
              </MobileAccordion>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[hsl(220,22%,5%)] border-t border-white/[0.04]">
        <div className="container-narrow px-5 md:px-8 lg:px-16 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/25 text-center">
          <p>&copy; {new Date().getFullYear()} FLASH CAST SDN. BHD. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>SSM: XXXXXXXXXX</span>
            <span className="w-px h-3 bg-white/[0.06]" />
            <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <span className="w-px h-3 bg-white/[0.06]" />
            <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
