import { formatCabinetAmount, type CabinetOffer } from '@/data/cabinetOffers';
import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/cabinetPricingText.json';
import { cabinetPricingLabels } from '@/lib/cabinetOfferPricing';
import '@/styles/components/cabinet-pricing.css';

export function CabinetPriceBreakdown({ offer, summary = false }: { offer: CabinetOffer; summary?: boolean }) {
  const { language } = useLanguage();
  const t = text[language], labels = cabinetPricingLabels(offer, language);
  return <div className={`cabinet-price-breakdown${summary ? ' cabinet-price-breakdown--summary' : ''}`} data-offer-price={offer.id}>
    <span>{labels.campaign}</span>
    <strong data-campaign-amount>{formatCabinetAmount(offer.amountMyr)}</strong>
    {!summary && <>
      <div className="cabinet-price-breakdown__comparison">
        <div><span>{t.standard}</span><b data-standard-amount>{formatCabinetAmount(offer.standardAmountMyr)}</b></div>
        <div className="cabinet-price-breakdown__saving"><span>{labels.discount}</span><b>{t.savingsLabel} {formatCabinetAmount(offer.savingsMyr)}</b></div>
      </div>
      <small className="cabinet-price-breakdown__area">{labels.area}</small>
    </>}
  </div>;
}
