import Link from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface FooterPreludeCtaProps {
  title: string;
  description: string;
  quoteLabel: string;
  whatsappLabel: string;
  eyebrow: string;
  quotePath?: string;
  id?: string;
  className?: string;
  whatsappSource?: string;
}

const FooterPreludeCta = ({
  title,
  description,
  quoteLabel,
  whatsappLabel,
  eyebrow,
  quotePath = "/quote",
  id,
  className,
  whatsappSource,
}: FooterPreludeCtaProps) => {
  const settings = useSiteSettings();

  return (
    <section className={cn("home-footer-prelude section-padding", className)} id={id}>
      <div className="home-footer-prelude__beam" aria-hidden="true" />
      <div className="container-narrow relative z-10">
        <Reveal>
          <div className="home-footer-prelude__panel">
            <span className="home-footer-prelude__rule" aria-hidden="true" />
            <div className="home-footer-prelude__copy">
              <p className="home-footer-prelude__eyebrow">{eyebrow}</p>
              <h2 className="home-footer-prelude__title">{title}</h2>
              <p className="home-footer-prelude__text">{description}</p>
            </div>
            <div className="home-footer-prelude__actions">
              <Link to={quotePath} className="home-footer-prelude__button home-footer-prelude__button--primary">
                <ArrowRight className="h-4 w-4" />
                <span>{quoteLabel}</span>
              </Link>
              <a
                href={settings.whatsapp_url(whatsappSource)}
                target="_blank"
                rel="noopener noreferrer"
                className="home-footer-prelude__button home-footer-prelude__button--secondary"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" />
                <span>{whatsappLabel}</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FooterPreludeCta;
