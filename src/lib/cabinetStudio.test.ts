import { savedDesignName } from './cabinetStudio';
import catalog from '@/i18n/cabinetStudioCatalog.json';
import { describe, expect, it } from 'vitest';
import { studioFinishes, studioSchemes, studioStyles, styleById } from '@/data/cabinetStudio';
import { applyFinish, cabinetFinishRoles, changeStyle, decodeDesign, designForScheme, encodeDesign, parseStudio, recommendSchemes, roles, studioPrice, studioQuotePath, suggestPalette, unchangedDesign, validateSaved } from './cabinetStudio';

describe('cabinet studio catalogue and design contract', () => {
  it('has twelve distinct style directions, thirty-six schemes and thirty-two valid finishes', () => {
    expect(studioStyles).toHaveLength(12); expect(studioSchemes).toHaveLength(36); expect(studioFinishes).toHaveLength(32);
    expect(studioFinishes.filter(f => f.kind === 'wood')).toHaveLength(16);
    expect(studioFinishes.filter(f => f.kind === 'solid')).toHaveLength(10);
    expect(studioFinishes.filter(f => f.kind === 'stone')).toHaveLength(6);
    expect(new Set(studioSchemes.map(s => JSON.stringify(s.finishes))).size).toBe(36);
    for (const s of studioSchemes) {
      const d = designForScheme(s.id);
      expect(decodeDesign(encodeDesign(d))).toEqual(d);
      for (const c of d.cabinets) expect(styleById(s.style).doors).toContain(c.door);
    }
  });
  it('retains legacy palette, selected cabinets, scene and anchored package sizes', () => {
    const { design } = parseStudio(new URLSearchParams('o=walnut-home&p=whole-home&s=walnut&c=dark-walnut&m=kitchen,wardrobe,tv,shoe&r=living'));
    expect(design.scene).toBe('living'); expect(design.scheme).toBe('midcentury-1');
    expect(design.cabinets.find(c => c.kind === 'wardrobe')?.width).toBe(3658);
    expect(design.cabinets[0]?.finishes.front).toBe('dark-walnut');
    expect(studioPrice(design, 'localhost').exact).toBe(false);
  });
  it('rejects corrupted, incompatible, oversized and injected shared states', () => {
    expect(decodeDesign('%%%%')).toBeNull(); expect(decodeDesign('a'.repeat(18001))).toBeNull();
    const original = designForScheme('modern-1');
    const bad = { ...original, cabinets: original.cabinets.map(c => ({ ...c, width: -1 })) };
    expect(decodeDesign(encodeDesign(bad))).toBeNull();
    const duplicate = { ...original, cabinets: [original.cabinets[0]!, original.cabinets[0]!] };
    expect(decodeDesign(encodeDesign(duplicate))).toBeNull();
    expect(parseStudio(new URLSearchParams('d=broken')).recovered).toBe(true);
    expect(validateSaved([{ id: 'bad', name: 'name', encoded: 'invalid' }])).toEqual([]);
  });
  it('keeps dimensions on style changes and never shows an old exact price', () => {
    const d = designForScheme('cream-1');
    expect(studioPrice(d, 'localhost').offer?.amountMyr).toBe(9574.8);
    expect(studioPrice(d, 'flashcast.com.my').offer).toBeNull();
    const edited = changeStyle(d, 'classic');
    expect(edited.cabinets.map(c => [c.width, c.height, c.depth])).toEqual(d.cabinets.map(c => [c.width, c.height, c.depth]));
    expect(unchangedDesign(edited)).toBe(false);
    expect(studioQuotePath(edited, 'zh', 'localhost')).not.toContain('9,574.80');
    expect(studioQuotePath(d, 'zh', 'flashcast.com.my')).not.toContain('9,574.80');
  });
  it('limits changes to the requested space and respects every recommendation lock', () => {
    const d = designForScheme('natural-1');
    d.cabinets[0]!.locks = ['front']; d.cabinets[1]!.locks = ['cabinet'];
    const suggested = suggestPalette(d, 2, 'whole');
    expect(suggested.cabinets[0]!.finishes.front).toBe(d.cabinets[0]!.finishes.front);
    expect(suggested.cabinets[1]).toEqual(d.cabinets[1]);
    expect(d.cabinets[0]!.finishes.front).toBe('pale-oak');
    const edited = applyFinish(d, d.cabinets[0]!.id, 'front', 'sage', 'current');
    expect(edited.cabinets.find(c => c.kind === 'wardrobe')?.finishes.front).toBe('pale-oak');
    expect(edited.cabinets[0]!.finishes.front).toBe('sage');
    d.cabinets.forEach(c => { c.locks = [...roles]; });
    expect(suggestPalette(d, 2, 'whole')).toEqual(d);
  });
  it('recommends reproducible choices from real preferences and transports complete designs', () => {
    const picks = recommendSchemes({ style: 'chinese', scene: 'bedroom', brightness: 'dark', storage: 'closed' });
    expect(picks).toHaveLength(3); expect(picks.every(s => s.style === 'chinese')).toBe(true);
    const d = designForScheme(picks[0]!.id); d.cabinets[0]!.width = 4000;
    for (const lang of ['zh', 'en', 'ms'] as const) {
      const path = studioQuotePath(d, lang, 'localhost')!;
      const details = new URL(path, 'https://flashcast.com.my').searchParams.get('details')!;
      expect(details).toContain('4000'); expect(details).toContain(`/${lang}/custom-cabinets?v=2&d=`);
    }
    expect(studioQuotePath({ ...d, cabinets: [] }, 'zh', 'localhost')).toBeNull();
  });
  it('only edits and quotes finishes that the cabinet actually has', () => {
    const design = designForScheme('modern-1');
    const wardrobe = design.cabinets.find(c => c.kind === 'wardrobe')!;
    expect(cabinetFinishRoles(wardrobe)).not.toContain('top');
    expect(cabinetFinishRoles(design.cabinets.find(c => c.kind === 'bookcase')!)).not.toContain('front');
    const changed = applyFinish(design, design.cabinets[0]!.id, 'top', 'black-stone', 'whole');
    expect(changed.cabinets.find(c => c.kind === 'wardrobe')).toEqual(wardrobe);
    const details = new URL(studioQuotePath(changed, 'zh', 'localhost')!, 'https://flashcast.com.my').searchParams.get('details')!;
    expect(details.split('\n').find(line => line.includes('衣柜:'))).not.toContain('台面:');
  });
});


describe('localized saved design names', () => {
  it('translates generated titles without changing stored names or custom titles', () => {
    const design = designForScheme('modern-1');
    for (const source of ['zh', 'en', 'ms'] as const) for (const target of ['zh', 'en', 'ms'] as const) {
      const name = `${catalog[source].styles.modern} · 1`;
      const saved = { id: 'old', name, design, updated: 1 };
      expect(savedDesignName(saved, target)).toBe(`${catalog[target].styles.modern} · 1`);
      expect(saved.name).toBe(name);
      expect(savedDesignName({ ...saved, name: 'My apartment — custom title' }, target)).toBe('My apartment — custom title');
    }
  });
});
