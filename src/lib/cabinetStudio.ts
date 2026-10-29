import { cabinetPricingSummary } from '@/lib/cabinetOfferPricing';
import pricingText from '@/i18n/cabinetPricingText.json';
import { cabinetDefaults, finishById, schemeById, studioFinishes, studioScenes, studioSchemes, studioStyles, styleById, type CabinetKind, type Door, type FinishId, type FinishRole, type Finishes, type Handle, type StudioScene, type StudioScheme, type StudioStyle } from '@/data/cabinetStudio';
import { cabinetOffers, canPreviewCabinetDrafts } from '@/data/cabinetOffers';
import { parseCabinetSelection } from '@/lib/customCabinetSelection';
import { buildQuotePath } from '@/lib/quoteContext';
import labels from '@/i18n/cabinetStudioCatalog.json';
import text from '@/i18n/cabinetStudioText.json';
import type { Language } from '@/i18n/routes';

export interface StudioCabinet {
  id: string; kind: CabinetKind; width: number; height: number; depth: number;
  finishes: Finishes; door: Door; handle: Handle; grain: 'vertical' | 'horizontal'; locks: string[];
}
export interface StudioDesign { version: 2; scheme: string; style: StudioStyle; scene: StudioScene; cabinets: StudioCabinet[] }
export interface SavedDesign { id: string; name: string; design: StudioDesign; updated: number }
export function savedDesignName(item: SavedDesign, language: Language): string {
  const scheme = schemeById(item.design.scheme)!;
  const generated = Object.values(labels).some(catalog => [String(scheme.variant), String(scheme.variant).padStart(2, '0')]
    .some(variant => item.name === `${catalog.styles[scheme.style]} · ${variant}`));
  return generated ? `${labels[language].styles[scheme.style]} · ${scheme.variant}` : item.name;
}
export const storageKey = 'flashcast.cabinet-studio.v2';
export const roles: FinishRole[] = ['front', 'body', 'open', 'top'];
export const kinds = Object.keys(cabinetDefaults) as CabinetKind[];
const legacySchemes: Record<string, string> = { 'cream-essential': 'cream-1', 'natural-home': 'natural-1', 'grey-home': 'modern-2', 'walnut-home': 'midcentury-1' };
const legacyPaletteSchemes: Record<string, string> = { 'cream-oak': 'cream-1', 'oat-wood': 'cream-2', 'oak-white': 'natural-1', 'light-walnut': 'natural-3', 'cashmere-oak': 'modern-2', 'grey-smoke': 'modern-3', 'walnut-cream': 'midcentury-1', 'dark-walnut': 'midcentury-2' };
export const cabinetScene = (cabinet: StudioCabinet) => cabinetDefaults[cabinet.kind].scene;
export function cabinetFinishRoles(cabinet: StudioCabinet): FinishRole[] {
  return roles.filter(role => role === 'body' || role === 'front' && cabinet.kind !== 'bookcase' || role === 'open' && (['bookcase', 'sideboard'].includes(cabinet.kind) || cabinet.door === 'glass') || role === 'top' && ['base', 'tv', 'sideboard'].includes(cabinet.kind));
}
export const cloneDesign = (value: StudioDesign): StudioDesign => JSON.parse(JSON.stringify(value));
export function newCabinet(kind: CabinetKind, scheme: StudioScheme, id = kind as string): StudioCabinet {
  const { width, height, depth } = cabinetDefaults[kind];
  const style = styleById(scheme.style);
  return { id, kind, width, height, depth, finishes: { ...scheme.finishes }, door: style.door, handle: style.handles, grain: 'vertical', locks: [] };
}
export function designForScheme(id: string): StudioDesign {
  const scheme = schemeById(id) ?? studioSchemes[0]!;
  const offer = cabinetOffers.find(item => item.id === scheme.offerId);
  const cabinets = offer ? offer.specs.map(spec => ({ ...newCabinet(spec.id, scheme), width: Math.round(spec.widthFt * 304.8), height: spec.heightMm, depth: spec.depthMm })) : kinds.map(kind => newCabinet(kind, scheme));
  return { version: 2, scheme: scheme.id, style: scheme.style, scene: 'kitchen', cabinets };
}
// Stable IDs and numeric dimensions only: personal information never enters shared URLs.
export function encodeDesign(design: StudioDesign): string {
  return btoa(JSON.stringify([2, design.scheme, design.style, design.scene, design.cabinets.map(c => [c.id, c.kind, c.width, c.height, c.depth, ...roles.map(role => c.finishes[role]), c.door, c.handle, c.grain, c.locks])])).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeDesign(value: string): StudioDesign | null {
  if (value.length > 18000) return null;
  try {
    const data: unknown = JSON.parse(atob(value.replaceAll('-', '+').replaceAll('_', '/')));
    if (!Array.isArray(data) || data.length !== 5 || data[0] !== 2 || !schemeById(data[1]) || !studioStyles.some(s => s.id === data[2]) || !studioScenes.includes(data[3]) || !Array.isArray(data[4]) || data[4].length > 12) return null;
    const cabinets: StudioCabinet[] = [];
    for (const raw of data[4]) {
      if (!Array.isArray(raw) || raw.length !== 13) return null;
      const [id, kind, width, height, depth, front, body, open, top, door, handle, grain, locks] = raw;
      if (typeof id !== 'string' || !/^[a-z0-9-]{1,48}$/.test(id) || cabinets.some(c => c.id === id) || !kinds.includes(kind)) return null;
      if (![width, height, depth].every(Number.isInteger) || !validSize('width', width) || !validSize('height', height) || !validSize('depth', depth)) return null;
      if (![front, body, open, top].every(f => studioFinishes.some(item => item.id === f))) return null;
      if (![front, body, open].every(f => finishById(f).kind !== 'stone') || finishById(top).kind !== 'stone') return null;
      if (!(styleById(data[2]).doors as readonly string[]).includes(door) || !['hidden', 'brass', 'nickel', 'black'].includes(handle) || !['vertical', 'horizontal'].includes(grain)) return null;
      if (!Array.isArray(locks) || locks.some(lock => ![...roles, 'cabinet'].includes(lock))) return null;
      cabinets.push({ id, kind, width, height, depth, finishes: { front, body, open, top }, door, handle, grain, locks: [...new Set(locks)] });
    }
    return { version: 2, scheme: data[1], style: data[2], scene: data[3], cabinets };
  } catch { return null; }
}
export function validSize(key: 'width' | 'height' | 'depth', value: number) {
  const ranges = { width: [300, 6000], height: [300, 3000], depth: [150, 1000] };
  return Number.isFinite(value) && value >= ranges[key][0]! && value <= ranges[key][1]!;
}
export function parseStudio(params: URLSearchParams): { design: StudioDesign; recovered: boolean } {
  if (params.has('d')) {
    const design = decodeDesign(params.get('d')!);
    return { design: design ?? designForScheme('modern-1'), recovered: !design || params.getAll('d').length > 1 };
  }
  if (['o', 'p', 's', 'c', 'm', 'r'].some(key => params.has(key))) {
    const old = parseCabinetSelection(params);
    const id = legacyPaletteSchemes[old.selection.paletteId] ?? legacySchemes[old.selection.offerId ?? ''] ?? 'cream-1';
    const design = designForScheme(id);
    const anchor = legacySchemes[old.selection.offerId ?? ''];
    if (anchor && anchor !== id) {
      const oldCabinets = designForScheme(anchor).cabinets;
      design.cabinets = oldCabinets.map(c => ({ ...c, finishes: { ...schemeById(id)!.finishes }, door: styleById(design.style).door, handle: styleById(design.style).handles }));
      design.scheme = anchor;
    }
    const map: Record<CabinetKind, string> = { base: 'kitchen', wall: 'kitchen', wardrobe: 'wardrobe', tv: 'tv', shoe: 'shoe', sideboard: 'sideboard', bookcase: 'bookcase' };
    design.cabinets = design.cabinets.filter(c => (old.selection.modules as readonly string[]).includes(map[c.kind]));
    for (const module of old.selection.modules) if (!design.cabinets.some(c => map[c.kind] === module)) {
      for (const kind of kinds.filter(k => map[k] === module)) design.cabinets.push(newCabinet(kind, schemeById(id)!));
    }
    design.scene = old.selection.scene;
    return { design, recovered: old.recovered };
  }
  return { design: designForScheme('modern-1'), recovered: false };
}
export function studioParams(design: StudioDesign, current = new URLSearchParams()) {
  const params = new URLSearchParams(current);
  for (const key of ['o', 'p', 's', 'c', 'm', 'r']) params.delete(key);
  params.set('v', '2'); params.set('d', encodeDesign(design));
  return params;
}
export function designSignature(design: StudioDesign) {
  return JSON.stringify([design.style, design.cabinets.map(({ id: _id, locks: _locks, ...c }) => c)]);
}
export function unchangedDesign(design: StudioDesign) { return designSignature(design) === designSignature(designForScheme(design.scheme)); }
export function changeStyle(design: StudioDesign, style: StudioStyle): StudioDesign {
  const rule = styleById(style);
  return { ...design, style, cabinets: design.cabinets.map(c => ({ ...c, door: (rule.doors as readonly string[]).includes(c.door) ? c.door : rule.door })) };
}
export function applyFinish(design: StudioDesign, selected: string, role: FinishRole, finish: FinishId, scope: 'whole' | 'current') {
  return { ...design, cabinets: design.cabinets.map(c => cabinetFinishRoles(c).includes(role) && (scope === 'whole' || cabinetScene(c) === design.scene || c.id === selected) ? { ...c, finishes: { ...c.finishes, [role]: finish } } : c) };
}
export function suggestPalette(design: StudioDesign, index: number, scope: 'whole' | 'current'): StudioDesign {
  const options = studioSchemes.filter(s => s.style === design.style);
  const scheme = options[index % options.length]!;
  return { ...design, cabinets: design.cabinets.map(c => {
    if (c.locks.includes('cabinet') || scope === 'current' && cabinetScene(c) !== design.scene) return c;
    return { ...c, finishes: Object.fromEntries(roles.map(role => [role, c.locks.includes(role) || !cabinetFinishRoles(c).includes(role) ? c.finishes[role] : scheme.finishes[role]])) as Finishes };
  }) };
}
export interface Preferences { style: string; scene: StudioScene; brightness: string; storage: string }
export function recommendSchemes(p: Preferences): StudioScheme[] {
  return studioSchemes.filter(s => designForScheme(s.id).cabinets.some(c => cabinetScene(c) === p.scene)).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id)).slice(0, 3);
  function score(s: StudioScheme) {
    const d = designForScheme(s.id);
    return (s.style === p.style ? 10 : 0) + (d.cabinets.some(c => cabinetScene(c) === p.scene) ? 4 : 0) + (finishById(s.finishes.front).tone === p.brightness ? 3 : 0) + (p.storage === 'display' && ['natural', 'oriental', 'italian'].includes(s.style) || p.storage === 'closed' && ['modern', 'cream', 'european'].includes(s.style) ? 2 : 0);
  }
}
export function paletteWarnings(cabinet: StudioCabinet) {
  const finishes = [cabinet.finishes.front, cabinet.finishes.body, cabinet.finishes.open];
  return { dark: finishes.filter(id => finishById(id).tone === 'dark').length >= 2, grain: new Set(finishes.filter(id => finishById(id).kind === 'wood')).size >= 3 };
}
export function studioPrice(design: StudioDesign, hostname: string) {
  const offer = cabinetOffers.find(o => o.id === schemeById(design.scheme)?.offerId);
  return { offer: offer && (offer.status === 'approved' || canPreviewCabinetDrafts(hostname)) ? offer : null, exact: unchangedDesign(design) };
}
export function studioSharePath(design: StudioDesign, language: Language) { return `/${language}/custom-cabinets?${studioParams(design)}&view=design`; }
export function studioQuotePath(design: StudioDesign, language: Language, hostname: string) {
  if (!design.cabinets.length) return null;
  const t = text[language]; const l = labels[language]; const { offer, exact } = studioPrice(design, hostname);
  const details = [l.styles[design.style], ...(offer && exact ? [...cabinetPricingSummary(offer, language), pricingText[language].basis, pricingText[language].scope] : [t.quote]),
    ...design.cabinets.map(c => `${l.scenes[cabinetScene(c)]} · ${l.kinds[c.kind]}: ${c.width} × ${c.height} × ${c.depth} mm; ${cabinetFinishRoles(c).map(r => `${l.roles[r]}: ${l.finishes[c.finishes[r]]}`).join(', ')}; ${l.doors[c.door]}; ${l.handles[c.handle]}; ${t[c.grain]}`),
    t.finishNote, t.craftNote, t.priceScope, t.visualScope, `https://flashcast.com.my${studioSharePath(design, language)}`].join('\n');
  return buildQuotePath({ source: 'service', title: t.title, projectType: 'Custom Built-In Furniture', details });
}
export function validateSaved(value: unknown): SavedDesign[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.encoded !== 'string') return [];
    const design = decodeDesign(item.encoded);
    return design ? [{ id: item.id.slice(0, 64), name: item.name.slice(0, 80), design, updated: Number(item.updated) || 0 }] : [];
  });
}
