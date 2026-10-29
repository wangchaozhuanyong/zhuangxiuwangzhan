import { cabinetPricingSummary } from '@/lib/cabinetOfferPricing';
import pricingText from '@/i18n/cabinetPricingText.json';
import { cabinetRoomScene } from '@/data/cabinetRoomScenes';
import { finishById, schemeById, type CabinetKind, type FinishId, type FinishRole, type StudioScene } from '@/data/cabinetStudio';
import { cabinetOffers, canPreviewCabinetDrafts } from '@/data/cabinetOffers';
import { cabinetScene, cloneDesign, designForScheme, studioPrice, studioSharePath, type StudioDesign } from './cabinetStudio';
import { buildQuotePath } from './quoteContext';
import labels from '@/i18n/cabinetStudioCatalog.json';
import text from '@/i18n/cabinetStudioText.json';
import copy from '@/i18n/cabinetPaletteText.json';
import type { Language } from '@/i18n/routes';

// Only these rooms have an individual, traced photograph for every scheme.
export const paletteScenes: StudioScene[] = ['kitchen', 'bedroom', 'living'];
export function paletteRooms(scheme: string): StudioScene[] {
  const baseline = designForScheme(scheme);
  return paletteScenes.filter(room => baseline.cabinets.some(c => cabinetScene(c) === room));
}

// The original design is never migrated or overwritten. Old dimensions and extra
// cabinets stay in storage/share links; the fixed-scene renderer receives its own projection.
export function palettePreview(design: StudioDesign): StudioDesign {
  const baseline = designForScheme(design.scheme);
  const scene = paletteRooms(design.scheme).includes(design.scene) ? design.scene : 'kitchen';
  return { ...baseline, scene, cabinets: baseline.cabinets.map(c => {
    const previous = design.cabinets.find(item => item.kind === c.kind);
    return { ...c, finishes: { ...(previous?.finishes ?? c.finishes) } };
  }) };
}
export interface PalettePart { id: string; kind: CabinetKind; role: FinishRole; finish: FinishId }
export function paletteParts(design: StudioDesign): PalettePart[] {
  const preview = palettePreview(design);
  const scene = cabinetRoomScene(preview.style, preview.scene, preview.scheme);
  const parts = new Map<string, PalettePart>();
  for (const surface of scene.surfaces) {
    const cabinet = preview.cabinets.find(c => c.kind === surface.kind);
    if (!cabinet) continue;
    const id = `${surface.kind}-${surface.role}`;
    parts.set(id, { id, kind: surface.kind, role: surface.role, finish: cabinet.finishes[surface.role] });
  }
  const order: FinishRole[] = ['front', 'body', 'open', 'top'];
  return [...parts.values()].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
}
export function changePaletteFinish(design: StudioDesign, partId: string | readonly string[], finish: FinishId): StudioDesign {
  if (typeof partId !== 'string') return [...new Set(partId)].reduce((next, id) => changePaletteFinish(next, id, finish), design);
  if (partId === 'all-fronts') return paletteParts(design).filter(part => part.role === 'front').reduce((next, part) => changePaletteFinish(next, part.id, finish), design);
  const part = paletteParts(design).find(p => p.id === partId);
  if (!part || (finishById(finish).kind === 'stone') !== (part.role === 'top')) return design;
  const next = cloneDesign(design);
  const existing = next.cabinets.filter(c => c.kind === part.kind);
  if (!existing.length) next.cabinets.push(palettePreview(design).cabinets.find(c => c.kind === part.kind)!);
  next.cabinets = next.cabinets.map(c => c.kind === part.kind ? { ...c, finishes: { ...c.finishes, [part.role]: finish } } : c);
  return next;
}
export function restorePalette(design: StudioDesign): StudioDesign {
  const finishes = schemeById(design.scheme)!.finishes;
  return { ...design, cabinets: design.cabinets.map(c => ({ ...c, finishes: { ...finishes } })) };
}
export function hasLegacyGeometry(design: StudioDesign): boolean {
  const base = designForScheme(design.scheme);
  const geometry = (d: StudioDesign) => JSON.stringify([d.style, d.cabinets.map(c => [c.id, c.kind, c.width, c.height, c.depth, c.door, c.handle, c.grain])]);
  return geometry(base) !== geometry(design);
}
export function visiblePaletteOffer(design: StudioDesign, hostname: string) {
  return cabinetOffers.find(o => o.id === schemeById(design.scheme)?.offerId && (o.status === 'approved' || canPreviewCabinetDrafts(hostname)));
}
export function paletteQuotePath(design: StudioDesign, language: Language, hostname: string) {
  if (!design.cabinets.length) return null;
  const t = text[language], p = copy[language], l = labels[language];
  const scheme = schemeById(design.scheme)!;
  const { offer, exact } = studioPrice(design, hostname);
  const specs = visiblePaletteOffer(design, hostname);
  // submit-lead stores at most 4000 characters. Reserve the complete, lossless
  // share state before adding optional human-readable detail, never cut a URL.
  const required = [
    `${l.styles[scheme.style]} · ${String(scheme.variant).padStart(2, '0')}`,
    ...(offer && exact ? cabinetPricingSummary(offer, language) : [exact ? t.quote : t.adjusted]),
    `${p.consult} · ${p.promotionPeriod}`,
    `https://flashcast.com.my${studioSharePath(design, language)}`,
    p.completePlan,
  ];
  let details = required.join('\n');
  if (details.length > 4000) return null;
  const descriptions = [
    ...(offer && exact ? [pricingText[language].basis, pricingText[language].scope] : []),
    ...paletteRooms(design.scheme).flatMap(scene => paletteParts({ ...design, scene }).map(part => `${l.scenes[scene]} · ${p.parts[part.id as keyof typeof p.parts]}: ${l.finishes[part.finish]}`)),
    specs ? `${specs.status === 'draft' ? p.proposedSpecs : t.specifications}:\n${specs.specs.map(s => `${l.kinds[s.id]}: ${Math.round(s.widthFt * 304.8)} × ${s.heightMm} × ${s.depthMm} ${t.mm}`).join('\n')}` : p.specsOnRequest,
    ...(hasLegacyGeometry(design) ? [p.legacyNote, ...design.cabinets.map(c => `${l.scenes[cabinetScene(c)]} · ${l.kinds[c.kind]}: ${c.width} × ${c.height} × ${c.depth} ${t.mm}; ${Object.entries(c.finishes).map(([role, finish]) => `${l.roles[role as FinishRole]}: ${l.finishes[finish]}`).join(', ')}; ${l.doors[c.door]}; ${l.handles[c.handle]}`)] : []),
    p.extraRequest, t.finishNote, t.priceScope, t.visualScope,
  ].flatMap(line => line.split('\n'));
  for (const line of descriptions) {
    if (details.length + line.length + 1 <= 4000) details += `\n${line}`;
  }
  return buildQuotePath({ source: 'service', title: t.eyebrow, projectType: 'Custom Built-In Furniture', details });
}
