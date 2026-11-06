import { cabinetPromotionPercent, formatCabinetAmount, type CabinetOffer } from '@/data/cabinetOffers';
import text from '@/i18n/cabinetPricingText.json';
import type { Language } from '@/i18n/routes';

export function cabinetPricingLabels(offer: CabinetOffer, language: Language) {
  const t = text[language];
  return {
    area: t.area.replace('{area}', new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(offer.areaSqFt)),
    discount: t.discount.replace('{percent}', String(cabinetPromotionPercent)),
    campaign: offer.status === 'draft' ? t.draftCampaign : t.campaign,
    saving: t.saving.replace('{percent}', String(cabinetPromotionPercent)).replace('{amount}', formatCabinetAmount(offer.savingsMyr)),
  };
}

export function cabinetPricingSummary(offer: CabinetOffer, language: Language): string[] {
  const t = text[language], labels = cabinetPricingLabels(offer, language);
  return [
    `${labels.campaign}: ${formatCabinetAmount(offer.amountMyr)}`,
    `${t.standard}: ${formatCabinetAmount(offer.standardAmountMyr)}`,
    labels.area, labels.saving,
  ];
}
