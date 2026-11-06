import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/cabinetStudioText.json';
import { studioPrice, type StudioDesign } from '@/lib/cabinetStudio';
import { formatCabinetAmount } from '@/data/cabinetOffers';
import { CabinetPriceBreakdown } from './CabinetPriceBreakdown';
export function StudioPrice({ design, compact = false, summary = false }: { design: StudioDesign; compact?: boolean; summary?: boolean }) {
  const { language } = useLanguage(); const t = text[language]; const { offer, exact } = studioPrice(design, window.location.hostname);
  return <div className="studio-price" data-price-state={offer && exact ? offer.status : exact ? 'quote' : 'adjusted'}>
    {offer && exact ? <CabinetPriceBreakdown offer={offer} summary={summary} /> : <span>{exact ? t.quote : t.adjusted}</span>}
    {offer && !exact && !compact && <small>{t.originalPrice} · {formatCabinetAmount(offer.amountMyr)}</small>}
    {!compact && <><small>{t.priceScope}</small><small>{t.visualScope}</small></>}
  </div>;
}
