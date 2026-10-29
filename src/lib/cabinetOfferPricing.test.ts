import { describe, expect, it } from 'vitest';
import { calculateCabinetPrice, cabinetOffers, cabinetSpecArea, formatCabinetAmount } from '@/data/cabinetOffers';
import { cabinetPricingSummary } from './cabinetOfferPricing';
import { designForScheme } from './cabinetStudio';
import { paletteQuotePath, changePaletteFinish } from './cabinetPalette';

describe('owner-defined cabinet rate and campaign', () => {
  it('measures front width times height, separates rows and never counts depth or internal boards twice', () => {
    const base = { id: 'base', module: 'kitchen', widthFt: 10, heightMm: 914.4, depthMm: 600 } as const;
    const wall = { ...base, id: 'wall', heightMm: 609.6 } as const;
    expect(cabinetSpecArea(base)).toBeCloseTo(30);
    expect(calculateCabinetPrice([base, wall])).toEqual({ areaSqFt: 50, standardAmountMyr: 6000, amountMyr: 4800, savingsMyr: 1200 });
    expect(calculateCabinetPrice([{ ...base, depthMm: 700 }, wall])).toEqual(calculateCabinetPrice([base, wall]));
  });
  it('matches the four reviewed package calculations, rounding only final monetary totals', () => {
    const expected = [
      [99.7375328084, 11968.50, 9574.80, 2393.70],
      [151.9028871391, 18228.35, 14582.68, 3645.67],
      [176.1811023622, 21141.73, 16913.39, 4228.34],
      [210.6299212598, 25275.59, 20220.47, 5055.12],
    ];
    cabinetOffers.forEach((offer, index) => {
      const [area, standard, campaign, saving] = expected[index];
      expect(offer.areaSqFt).toBeCloseTo(area, 6);
      expect(offer.standardAmountMyr).toBe(standard);
      expect(offer.amountMyr).toBe(campaign);
      expect(offer.savingsMyr).toBe(saving);
      expect(offer.status).toBe('draft');
    });
    expect(formatCabinetAmount(9574.8)).toBe('RM 9,574.80');
    expect(formatCabinetAmount(6000)).toBe('RM 6,000');
  });
  it('keeps the displayed offer and enquiry consistent in three languages without exposing stale or public draft prices', () => {
    for (const offer of cabinetOffers) for (const lang of ['zh', 'en', 'ms'] as const) {
      const design = designForScheme(offer.schemeId);
      const details = (value: typeof design, host: string) => new URL(paletteQuotePath(value, lang, host)!, 'https://flashcast.com.my').searchParams.get('details')!;
      const quote = details(design, 'localhost');
      for (const line of cabinetPricingSummary(offer, lang)) expect(quote).toContain(line);
      expect(quote.length).toBeLessThanOrEqual(4000);
      expect(details(changePaletteFinish(design, 'wall-front', 'sage'), 'localhost')).not.toContain(formatCabinetAmount(offer.amountMyr));
      expect(details(design, 'flashcast.com.my')).not.toContain(formatCabinetAmount(offer.amountMyr));
    }
  });
});
