import { ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import LocalizedLink from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { cabinetOffers, canPreviewCabinetDrafts, visibleCabinetOffer } from "@/data/cabinetOffers";
import { CabinetPriceBreakdown } from '@/components/cabinets/CabinetPriceBreakdown';
import { cabinetPreviewPath } from "@/data/customCabinets";
import { useLanguage } from "@/i18n/LanguageContext";
import { customCabinetsHomeText } from "@/i18n/customCabinetsHomeText";
import { trackCtaClick } from "@/lib/analytics";
import "@/styles/components/home-cabinets.css";

export default function SchemeAHomeCabinets() {
  const { language } = useLanguage();
  const copy = customCabinetsHomeText[language];
  const previewDrafts = canPreviewCabinetDrafts(window.location.hostname);
  return <section className="home-cabinets" data-home-section="custom-cabinets" aria-labelledby="home-cabinets-title">
    <div className="scheme-a-frame home-cabinets__layout">
      <header className="scheme-a-heading home-cabinets__copy">
        <p className="scheme-a-eyebrow">{copy.eyebrow}</p>
        <h2 id="home-cabinets-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="home-cabinets__actions">
          <Button asChild size="lg"><LocalizedLink to="/custom-cabinets#cabinet-packages" onClick={() => trackCtaClick("custom_cabinets", "home_second_module", { destination: "/custom-cabinets" })}>{copy.design}<ArrowUpRight aria-hidden="true" /></LocalizedLink></Button>
          <Button asChild variant="outline" size="lg"><LocalizedLink to="/custom-cabinets?view=inspire#cabinet-packages">{copy.browse}<ArrowUpRight aria-hidden="true" /></LocalizedLink></Button>
        </div>
      </header>
      <figure className="home-cabinets__visual">
        <DeferredSmartImage src={cabinetPreviewPath("cream-oak", "living")} alt={copy.imageAlt} width={1536} height={1024} sizes="(max-width: 767px) 100vw, 55vw" rootMargin="1200px 0px" />
      </figure>
      <div className="home-cabinets__packages">
        {cabinetOffers.map((offer, index) => {
          const visible = visibleCabinetOffer(offer, previewDrafts);
          return <LocalizedLink key={offer.id} to={`/custom-cabinets?view=inspire&pick=${offer.schemeId}#cabinet-packages`} onClick={() => trackCtaClick("custom_cabinets_package", "home_second_module", { package_id: offer.packageId, style_id: offer.styleId, destination: "/custom-cabinets" })}>
            <span aria-hidden="true">0{index + 1}</span><strong>{copy.packages[index]}</strong><p>{copy.packageDescriptions[index]}</p><div className="home-cabinets__package-price">{visible ? <CabinetPriceBreakdown offer={visible} /> : <><small>{copy.priceLabel}</small><b>{copy.pendingPrice}</b></>}</div><ArrowUpRight aria-hidden="true" />
          </LocalizedLink>;
        })}
      </div>
    </div>
  </section>;
}
