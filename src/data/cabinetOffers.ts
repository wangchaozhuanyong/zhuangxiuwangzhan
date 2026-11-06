import { cabinetPackages, type CabinetModule, type CabinetPaletteId, type CabinetSelection, type CabinetStyleId } from "@/data/customCabinets";

export type CabinetSpecId = "base" | "wall" | "wardrobe" | "tv" | "shoe";
export interface CabinetPackageSpec {
  id: CabinetSpecId;
  module: CabinetModule;
  widthFt: number;
  heightMm: number;
  depthMm: number;
}
export interface CabinetOffer {
  id: "cream-essential" | "natural-home" | "grey-home" | "walnut-home";
  schemeId: string;
  packageId: "kitchen-wardrobe" | "whole-home";
  styleId: CabinetStyleId;
  paletteId: CabinetPaletteId;
  /** Layout proposals only. No selling price or supplier specification is approved. */
  status: "draft" | "approved";
  amountMyr: number;
  standardAmountMyr: number;
  savingsMyr: number;
  areaSqFt: number;
  specs: readonly CabinetPackageSpec[];
}

const specs = (wardrobeWidthFt: number, wholeHome: boolean, baseWidthFt = 10, wallWidthFt = 10, tvWidthFt = 6, shoeWidthFt = 4): CabinetPackageSpec[] => [
  { id: "base", module: "kitchen", widthFt: baseWidthFt, heightMm: 850, depthMm: 600 },
  { id: "wall", module: "kitchen", widthFt: wallWidthFt, heightMm: 750, depthMm: 350 },
  { id: "wardrobe", module: "wardrobe", widthFt: wardrobeWidthFt, heightMm: 2400, depthMm: 600 },
  ...(wholeHome ? [
    { id: "tv", module: "tv", widthFt: tvWidthFt, heightMm: 450, depthMm: 400 },
    { id: "shoe", module: "shoe", widthFt: shoeWidthFt, heightMm: 2100, depthMm: 350 },
  ] satisfies CabinetPackageSpec[] : []),
];

export const cabinetRateMyrPerSqFt = 120;
export const cabinetPromotionPercent = 20;
export const cabinetSpecArea = (spec: CabinetPackageSpec) => spec.widthFt * spec.heightMm / 304.8;
export function calculateCabinetPrice(items: readonly CabinetPackageSpec[]) {
  const areaSqFt = items.reduce((total, spec) => total + cabinetSpecArea(spec), 0);
  // Calculate from unrounded area; round monetary totals to cents only at the end.
  const standard = areaSqFt * cabinetRateMyrPerSqFt;
  const standardCents = Math.round(standard * 100);
  const campaignCents = Math.round(standard * (100 - cabinetPromotionPercent));
  return { areaSqFt, standardAmountMyr: standardCents / 100, amountMyr: campaignCents / 100, savingsMyr: (standardCents - campaignCents) / 100 };
}
const pricedSpecs = (...args: Parameters<typeof specs>) => {
  const items = specs(...args);
  return { specs: items, ...calculateCabinetPrice(items) };
};

// The rate is owner-approved; materials, costs and final selling scope still need confirmation.
// Draft amounts/specifications must never be rendered on a public host or in SEO Offers.
export const cabinetOffers: readonly CabinetOffer[] = [
  { id: "cream-essential", schemeId: "cream-1", packageId: "kitchen-wardrobe", styleId: "cream", paletteId: "cream-oak", status: "draft", ...pricedSpecs(6, false) },
  { id: "natural-home", schemeId: "natural-1", packageId: "whole-home", styleId: "natural", paletteId: "oak-white", status: "draft", ...pricedSpecs(8, true) },
  { id: "grey-home", schemeId: "modern-2", packageId: "whole-home", styleId: "grey", paletteId: "cashmere-oak", status: "draft", ...pricedSpecs(10, true, 12, 10, 8) },
  { id: "walnut-home", schemeId: "midcentury-1", packageId: "whole-home", styleId: "walnut", paletteId: "walnut-cream", status: "draft", ...pricedSpecs(12, true, 12, 12, 8, 6) },
];

/** No query flag can expose draft prices on a real public host. */
export function canPreviewCabinetDrafts(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}

export function visibleCabinetOffer(offer: CabinetOffer, previewDrafts: boolean): CabinetOffer | null {
  return offer.status === "approved" || previewDrafts ? offer : null;
}

export function matchingCabinetOffer(selection: CabinetSelection): CabinetOffer | undefined {
  return cabinetOffers.find(offer => (!selection.offerId || selection.offerId === offer.id)
    && offer.packageId === selection.packageId
    && offer.styleId === selection.styleId && offer.paletteId === selection.paletteId
    && selection.modules.length === cabinetPackages[offer.packageId].length
    && cabinetPackages[offer.packageId].every(module => selection.modules.includes(module)));
}

export function cabinetOfferSelection(offer: CabinetOffer): CabinetSelection {
  return { offerId: offer.id, packageId: offer.packageId, styleId: offer.styleId, paletteId: offer.paletteId, modules: [...cabinetPackages[offer.packageId]], scene: "kitchen" };
}

export function formatCabinetAmount(amount: number): string {
  return `RM ${new Intl.NumberFormat("en-MY", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount)}`;
}
