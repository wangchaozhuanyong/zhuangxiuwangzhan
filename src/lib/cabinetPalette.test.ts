import { describe, expect, it } from 'vitest';
import { studioFinishes, studioSchemes } from '@/data/cabinetStudio';
import { cabinetOffers } from '@/data/cabinetOffers';
import { cabinetRoomScene } from '@/data/cabinetRoomScenes';
import { decodeDesign, designForScheme, encodeDesign, studioPrice, validateSaved } from './cabinetStudio';
import { changePaletteFinish, hasLegacyGeometry, paletteParts, palettePreview, paletteQuotePath, paletteRooms, restorePalette } from './cabinetPalette';

describe('customer palette capabilities', () => {
  it('binds homepage offers to the matching current catalogue scheme', () => {
    for (const offer of cabinetOffers) {
      expect(studioSchemes.find(scheme => scheme.id === offer.schemeId)?.offerId).toBe(offer.id);
      expect(designForScheme(offer.schemeId).cabinets.length).toBeGreaterThan(0);
    }
  });
  it('does not create an enquiry for an empty legacy configuration', () => {
    expect(paletteQuotePath({ ...designForScheme('cream-1'), cabinets: [] }, 'zh', 'flashcast.com.my')).toBeNull();
  });
  it('retains a complete restorable link within the backend limit for every scheme and long legacy plans', () => {
    for (const scheme of studioSchemes) {
      const original = designForScheme(scheme.id);
      const legacy = structuredClone(original);
      while (legacy.cabinets.length < 12) legacy.cabinets.push({ ...structuredClone(original.cabinets[0]!), id: `base-extra-${legacy.cabinets.length}` });
      for (const design of [original, legacy]) for (const lang of ['zh', 'en', 'ms'] as const) {
        const path = paletteQuotePath(design, lang, 'flashcast.com.my');
        expect(path).not.toBeNull();
        const details = new URL(path!, 'https://flashcast.com.my').searchParams.get('details')!;
        expect(details.length).toBeLessThanOrEqual(4000);
        const share = details.split('\n').find(line => line.startsWith('https://flashcast.com.my/'))!;
        expect(share).toBeTruthy();
        expect(decodeDesign(new URL(share).searchParams.get('d')!)).toEqual(design);
        expect(details.slice(0, 4000)).toContain(share);
      }
    }
  });
  it('keeps the largest supported cabinet IDs, finishes and locks restorable in all locales', () => {
    const design = designForScheme('chinese-1');
    const longest = (stone: boolean) => studioFinishes.filter(f => (f.kind === 'stone') === stone).sort((a, b) => b.id.length - a.id.length)[0]!.id;
    design.cabinets = Array.from({ length: 12 }, (_, index) => ({
      ...structuredClone(design.cabinets[0]!), id: `cabinet-${index}-`.padEnd(48, 'x'),
      width: 6000, height: 3000, depth: 1000, grain: 'horizontal',
      finishes: { front: longest(false), body: longest(false), open: longest(false), top: longest(true) },
      locks: ['front', 'body', 'open', 'top', 'cabinet'],
    }));
    expect(decodeDesign(encodeDesign(design))).toEqual(design);
    for (const lang of ['zh', 'en', 'ms'] as const) {
      const path = paletteQuotePath(design, lang, 'flashcast.com.my');
      expect(path).not.toBeNull();
      const details = new URL(path!, 'https://flashcast.com.my').searchParams.get('details')!;
      expect(details.length).toBeLessThanOrEqual(4000);
      const share = details.split('\n').find(line => line.startsWith('https://flashcast.com.my/'))!;
      expect(decodeDesign(new URL(share).searchParams.get('d')!)).toEqual(design);
    }
  });
  it('exposes only scheme rooms and independently mapped parts across all 36 styles', () => {
    expect(studioSchemes).toHaveLength(36);
    for (const scheme of studioSchemes) for (const scene of paletteRooms(scheme.id)) {
      const design = { ...designForScheme(scheme.id), scene };
      const mapped = cabinetRoomScene(design.style, scene, scheme.id).surfaces;
      expect(paletteParts(design).length).toBeGreaterThan(0);
      for (const part of paletteParts(design)) expect(mapped.some(s => s.kind === part.kind && s.role === part.role)).toBe(true);
      if (scene === 'bedroom') expect(paletteParts(design).some(p => p.role === 'top')).toBe(false);
    }
    expect(paletteRooms('cream-1')).toEqual(['kitchen', 'bedroom']);
  });
  it('changes one real part in one room without changing other colours or geometry', () => {
    const before = designForScheme('cream-1');
    const after = changePaletteFinish(before, 'wall-front', 'walnut');
    expect(after.cabinets.find(c => c.kind === 'wall')!.finishes.front).toBe('walnut');
    expect(after.cabinets.find(c => c.kind === 'base')).toEqual(before.cabinets.find(c => c.kind === 'base'));
    expect(after.cabinets.find(c => c.kind === 'wardrobe')).toEqual(before.cabinets.find(c => c.kind === 'wardrobe'));
    expect(before.cabinets.find(c => c.kind === 'wall')!.finishes.front).toBe('cream');
    expect(hasLegacyGeometry(after)).toBe(false);
    expect(studioPrice(after, 'localhost').exact).toBe(false);
    expect(studioPrice({ ...before, scene:'bedroom' }, 'localhost').exact).toBe(true);
    expect(restorePalette(after)).toEqual(before);
    expect(changePaletteFinish(before, 'wall-front', 'grey-stone')).toBe(before);
    expect(changePaletteFinish(before, 'base-top', 'walnut')).toBe(before);
    expect(changePaletteFinish(before, 'bookcase-front', 'walnut')).toBe(before);
  });
  it('recolours all visible doors in the current room by default and preserves bodies, worktops and other rooms',()=>{
    const design=designForScheme('cream-1');const next=changePaletteFinish(design,'all-fronts','sage');
    for(const kind of ['base','wall']){const cabinet=next.cabinets.find(c=>c.kind===kind)!;expect(cabinet.finishes.front).toBe('sage');expect(cabinet.finishes.body).toBe('pale-oak');expect(cabinet.finishes.top).toBe('warm-stone');}
    expect(next.cabinets.find(c=>c.kind==='wardrobe')).toEqual(design.cabinets.find(c=>c.kind==='wardrobe'));
    const quote=new URL(paletteQuotePath(next,'zh','localhost')!,'https://example.test').searchParams.get('details')!;
    expect(quote).toContain('吊柜门: 鼠尾草绿');expect(quote).toContain('地柜门: 鼠尾草绿');
    expect(studioPrice(next,'localhost').exact).toBe(false);
    expect(changePaletteFinish(design,'all-fronts','grey-stone')).toEqual(design);
  });
  it('keeps legacy saved data intact but projects the selected original photograph layout', () => {
    const old = designForScheme('cream-1'); old.cabinets[0]!.width = 4200; old.scene = 'study';
    old.cabinets.push({ ...structuredClone(old.cabinets[0]!), id:'base-second' });
    const encoded = encodeDesign(old);
    const saved = validateSaved([{ id:'old', name:'Old', updated:1, encoded }]);
    const preview = palettePreview(saved[0]!.design);
    expect(preview.scheme).toBe('cream-1'); expect(preview.scene).toBe('kitchen');
    expect(preview.cabinets.filter(c => c.kind === 'base')).toHaveLength(1);
    expect(preview.cabinets[0]!.width).toBe(3048);
    expect(encodeDesign(saved[0]!.design)).toBe(encoded);
    expect(decodeDesign(encoded)).toEqual(old);
    expect(hasLegacyGeometry(old)).toBe(true);
    const quote = new URL(paletteQuotePath(old, 'zh', 'localhost')!, 'https://example.test');
    expect(quote.searchParams.get('details')).toContain('4200');
    expect(quote.searchParams.get('details')).toContain('旧方案');
  });
  it('applies one colour to an arbitrary multi-selection and quotes exactly those parts', () => {
    const original = designForScheme('cream-1');
    const next = changePaletteFinish(original, ['wall-front', 'base-body', 'wall-front'], 'sage');
    const wall = next.cabinets.find(c => c.kind === 'wall')!, base = next.cabinets.find(c => c.kind === 'base')!;
    expect(wall.finishes.front).toBe('sage'); expect(base.finishes.body).toBe('sage');
    expect(wall.finishes.body).toBe('pale-oak'); expect(base.finishes.front).toBe('cream');
    expect(next.cabinets.find(c => c.kind === 'wardrobe')).toEqual(original.cabinets.find(c => c.kind === 'wardrobe'));
    expect(decodeDesign(encodeDesign(next))).toEqual(next);
    expect(studioPrice(next, 'localhost').exact).toBe(false);
    const details = new URL(paletteQuotePath(next, 'zh', 'localhost')!, 'https://example.test').searchParams.get('details')!;
    expect(details).toContain('吊柜门: 鼠尾草绿'); expect(details).toContain('地柜柜身: 鼠尾草绿');
    expect(details).toContain('地柜门: 奶油白'); expect(details).toContain('吊柜柜身: 浅橡木');
    expect(restorePalette(next)).toEqual(original);
  });
  it('supports all cabinet surfaces while keeping worktop materials and other rooms compatible', () => {
    for (const scheme of studioSchemes) for (const scene of paletteRooms(scheme.id)) {
      const original = { ...designForScheme(scheme.id), scene };
      const ids = paletteParts(original).filter(part => part.role !== 'top').map(part => part.id);
      const next = changePaletteFinish(original, ids, 'sage');
      for (const part of paletteParts(next)) expect(part.finish).toBe(part.role === 'top' ? scheme.finishes.top : 'sage');
      for (const cabinet of original.cabinets.filter(c => !ids.some(id => id.startsWith(c.kind + '-')))) {
        expect(next.cabinets.find(c => c.id === cabinet.id)).toEqual(cabinet);
      }
    }
    const design = designForScheme('cream-1');
    expect(changePaletteFinish(design, [], 'sage')).toBe(design);
    expect(changePaletteFinish(design, ['bookcase-front', 'wall-front'], 'grey-stone')).toBe(design);
    const stone = changePaletteFinish(design, ['wall-front', 'base-top'], 'grey-stone');
    expect(stone.cabinets.find(c => c.kind === 'wall')!.finishes.front).toBe('cream');
    expect(stone.cabinets.find(c => c.kind === 'base')!.finishes.top).toBe('grey-stone');
  });
  it('quotes the actual selected parts, includes the same share state and hides unapproved specs on public hosts', () => {
    const design = changePaletteFinish(designForScheme('cream-1'), 'wall-front', 'walnut');
    for (const lang of ['zh','en','ms'] as const) {
      const quote = new URL(paletteQuotePath(design, lang, 'flashcast.com.my')!, 'https://example.test');
      const details = quote.searchParams.get('details')!;
      expect(quote.searchParams.get('projectType')).toBe('Custom Built-In Furniture');
      expect(details).toContain(encodeDesign(design));
      expect(details).not.toContain('9,574.80'); expect(details).not.toContain('3048');
    }
    const designWithoutOffer = designForScheme('chinese-2');
    expect(new URL(paletteQuotePath(designWithoutOffer, 'zh', 'localhost')!, 'https://example.test').searchParams.get('details')).not.toContain('3048');
  });
});
