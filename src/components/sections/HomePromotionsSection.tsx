import { ArrowRight, BadgePercent, ShieldCheck } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeNewModulesText } from "@/i18n/newClientPageText";

const HomePromotionsSection = () => {
  const { language } = useLanguage();
  const t = homeNewModulesText[language];

  return (
    <section className="home-promotions-section section-padding" id="promotions">
      <div className="site-container">
        <Reveal>
          <div className="home-promotions-layout">
            <div className="home-promotions-icon" aria-hidden="true">
              <BadgePercent className="h-8 w-8" />
            </div>
            <div>
              <p className="new-client-page__eyebrow">{t.promotionsEyebrow}</p>
              <h2>{t.promotionsTitle}</h2>
            </div>
            <div className="home-promotions-copy">
              <p><ShieldCheck className="h-4 w-4" aria-hidden="true" />{t.promotionsIntro}</p>
              <LocalizedLink to="/promotions">
                {t.promotionsView} <ArrowRight className="h-4 w-4" />
              </LocalizedLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default HomePromotionsSection;
