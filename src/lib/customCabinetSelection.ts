import { cabinetPricingSummary } from '@/lib/cabinetOfferPricing';
import pricingText from '@/i18n/cabinetPricingText.json';
import {
  cabinetModules, cabinetPackageIds, cabinetPackages, cabinetPalettes, cabinetPalettesForStyle,
  cabinetScenes, cabinetStyleIds, type CabinetSelection, type CabinetStyleId,
} from "@/data/customCabinets";
import { cabinetOffers, matchingCabinetOffer, visibleCabinetOffer } from "@/data/cabinetOffers";
import text from "@/i18n/customCabinetsText.json";
import type { Language } from "@/i18n/routes";
import { buildQuotePath } from "@/lib/quoteContext";

const selectionKeys = ["p", "s", "c", "m", "r", "o"] as const;

/** Only reviewed IDs enter the view. An empty module list is a valid draft. */
export function parseCabinetSelection(params: URLSearchParams): { selection: CabinetSelection; recovered: boolean } {
  let recovered = selectionKeys.some((key) => params.getAll(key).length > 1);
  const known = <T extends string>(key: string, choices: readonly T[], fallback: T): T => {
    const value = params.get(key);
    if (value === null) return fallback;
    if (choices.includes(value as T)) return value as T;
    recovered = true;
    return fallback;
  };
  const packageId = known("p", cabinetPackageIds, "kitchen-wardrobe");
  const styleId = known("s", cabinetStyleIds, "cream");
  const paletteId = known("c", cabinetPalettesForStyle(styleId).map((palette) => palette.id), cabinetPalettesForStyle(styleId)[0]!.id);
  const scene = known("r", cabinetScenes, "kitchen");
  const requestedModules = params.has("m") ? params.get("m")!.split(",").filter(Boolean) : [...cabinetPackages[packageId]];
  if (requestedModules.some((module) => !cabinetModules.includes(module as typeof cabinetModules[number]))
      || new Set(requestedModules).size !== requestedModules.length) recovered = true;
  const modules = cabinetModules.filter((module) => requestedModules.includes(module));
  const selection: CabinetSelection = { packageId, styleId, paletteId, modules, scene };
  const requestedOffer = params.get("o");
  const offer = cabinetOffers.find(item => item.id === requestedOffer);
  if (requestedOffer !== null && !offer) recovered = true;
  // Old shared links infer a package once. Subsequent edits keep its identity,
  // so changing style cannot silently change the dimensions and price tier.
  const anchor = offer ?? matchingCabinetOffer(selection);
  if (anchor) selection.offerId = anchor.id;
  return { selection, recovered };
}

export function cabinetSelectionParams(selection: CabinetSelection, current = new URLSearchParams()) {
  const params = new URLSearchParams(current);
  if (selection.offerId) params.set("o", selection.offerId); else params.delete("o");
  params.set("p", selection.packageId);
  params.set("s", selection.styleId);
  params.set("c", selection.paletteId);
  params.set("m", cabinetModules.filter((module) => selection.modules.includes(module)).join(","));
  params.set("r", selection.scene);
  return params;
}

export function changeCabinetStyle(selection: CabinetSelection, styleId: CabinetStyleId): CabinetSelection {
  const compatible = cabinetPalettesForStyle(styleId);
  return { ...selection, styleId, paletteId: compatible.some((palette) => palette.id === selection.paletteId) ? selection.paletteId : compatible[0]!.id };
}

export function cabinetQuotePath(selection: CabinetSelection, language: Language, previewDrafts = false): string | null {
  if (!selection.modules.length) return null;
  const copy = text[language];
  const matchedOffer = matchingCabinetOffer(selection);
  const originalOffer = cabinetOffers.find(item => item.id === selection.offerId);
  const offer = matchedOffer ? visibleCabinetOffer(matchedOffer, previewDrafts) : null;
  const details = [
    ...(offer ? [
      `${copy.sales.selectedOffer}: ${copy.sales.names[offer.id]}`,
      ...cabinetPricingSummary(offer, language), pricingText[language].basis, pricingText[language].scope,
      `${offer.status === "draft" ? copy.sales.scopeDraft : copy.sales.scopeApproved}: ${offer.specs.map(spec => `${copy.sales.specLabels[spec.id]} ${spec.widthFt} ${copy.sales.ft} / ${copy.sales.height} ${spec.heightMm} ${copy.sales.mm} / ${copy.sales.depth} ${spec.depthMm} ${copy.sales.mm}`).join("; ")}`,
      `${copy.sales.materialTitle}: ${copy.sales.material.replace("{length}", String(offer.specs.find(spec => spec.id === "base")!.widthFt))}`,
      `${copy.sales.termsTitle}: ${copy.sales.terms}`,
      ...(offer.status === "draft" ? [copy.sales.draftNote] : []),
    ] : []),
    ...(!matchedOffer && originalOffer ? [`${copy.sales.selectedOffer}: ${copy.sales.names[originalOffer.id]} · ${copy.sales.customPrice}`] : []),
    `${copy.summary.package}: ${copy.packages[selection.packageId].title}`,
    `${copy.summary.modules}: ${selection.modules.map((module) => copy.modules[module]).join(" / ")}`,
    `${copy.summary.style}: ${copy.styles[selection.styleId].title}`,
    `${copy.summary.palette}: ${copy.palettes[selection.paletteId].name}`,
    ...(selection.modules.includes("kitchen") ? [`${copy.summary.countertop}: ${copy.palettes[selection.paletteId].countertop}`] : []),
    copy.quoteNote,
  ].join("\n");
  return buildQuotePath({ source: "service", title: copy.eyebrow, projectType: "Custom Built-In Furniture", details });
}

export const isCabinetPalette = (id: string) => cabinetPalettes.some((palette) => palette.id === id);
