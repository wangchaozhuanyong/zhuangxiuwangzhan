import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Heart, RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocalizedLink from '@/components/LocalizedLink';
import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/cabinetStudioText.json';
import copy from '@/i18n/cabinetPaletteText.json';
import labels from '@/i18n/cabinetStudioCatalog.json';
import pricingText from '@/i18n/cabinetPricingText.json';
import { schemeById, studioFinishes, type StudioScene } from '@/data/cabinetStudio';
import { hasLegacyGeometry, paletteParts, palettePreview, paletteQuotePath, paletteRooms, visiblePaletteOffer } from '@/lib/cabinetPalette';
import { studioSharePath, type StudioDesign } from '@/lib/cabinetStudio';
import { trackEvent } from '@/lib/analytics';
import { FinishSwatch } from './StudioDrawing';
import { StudioPrice } from './StudioPrice';
const RoomPreview = lazy(() => import('./CabinetRoomPreview'));

export default function StudioPackageDetails({ design, editing, onStart, onDetails, onScene, onFinish, onRestore, onSave, saved, storageError }: {
  design: StudioDesign; editing: boolean; onStart: () => void; onDetails: () => void; onScene: (scene: StudioScene) => void;
  onFinish: (parts: readonly string[], finish: typeof studioFinishes[number]['id']) => void; onRestore: () => void; onSave: () => boolean; saved: boolean; storageError: boolean;
}) {
  const { language } = useLanguage(); const t = text[language], p = copy[language], l = labels[language];
  const [partSelections, setParts] = useState<Partial<Record<StudioScene, string[]>>>({});
  const [expanded, setExpanded] = useState(false); const [zoom, setZoom] = useState(false); const [notice, setNotice] = useState('');
  const finishGridId = useId();
  const promotionNoteId = useId();
  const panel = useRef<HTMLDivElement>(null), lastControl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Same-route search updates may focus the public main element. Keep keyboard
    // users on their selected control inside this still-open product dialog.
    const frame = requestAnimationFrame(() => {
      const dialog = panel.current?.closest('[role="dialog"]');
      if (dialog && !dialog.contains(document.activeElement)) {
        const target = lastControl.current?.isConnected ? lastControl.current : panel.current?.querySelector<HTMLElement>('select,button');
        target?.focus({ preventScroll:true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [design, editing]);
  const preview = palettePreview(design), scheme = schemeById(design.scheme)!;
  const parts = paletteParts(preview), fronts = parts.filter(item => item.role === 'front');
  const cabinetParts = parts.filter(item => item.role !== 'top'), tops = parts.filter(item => item.role === 'top');
  const selectedIds = partSelections[preview.scene] ?? (fronts.length ? fronts : cabinetParts).map(item => item.id);
  const selectedParts = parts.filter(item => selectedIds.includes(item.id));
  const part = selectedParts[0] ?? fronts[0] ?? parts[0]!;
  const selectedFinish = selectedParts.length && new Set(selectedParts.map(item => item.finish)).size === 1 ? part.finish : null;
  const matches = (items: typeof parts) => items.length > 0 && items.length === selectedParts.length && items.every(item => selectedIds.includes(item.id));
  const offer = visiblePaletteOffer(design, window.location.hostname);
  const includedKinds = [...new Set(offer ? offer.specs.map(spec => spec.id) : paletteRooms(design.scheme).flatMap(scene => paletteParts({ ...design, scene }).map(item => item.kind)))];
  // Selection changes the checkmark, never the positions of the finish choices.
  const preferred = [...new Set([scheme.finishes[part.role], 'cream', 'oat', 'ivory', 'pale-oak', 'sage', 'walnut'])];
  const finishes = studioFinishes.filter(f => (f.kind === 'stone') === (part.role === 'top'));
  const choices = expanded || finishes.length <= 6 ? finishes : finishes.filter(f => preferred.includes(f.id)).sort((a,b) => preferred.indexOf(a.id) - preferred.indexOf(b.id)).slice(0,6);
  const partName = (id: string) => p.parts[id as keyof typeof p.parts];
  const selectionLabel = matches(cabinetParts) ? p.allCabinetParts : matches(fronts) ? p.allFronts : selectedParts.length <= 2 ? selectedParts.map(item => partName(item.id)).join(language === 'zh' ? '、' : ', ') : p.selectedParts.replace('{count}', String(selectedParts.length));
  function selectParts(ids: string[]) {
    setParts(current => ({ ...current, [preview.scene]:ids })); setExpanded(false);
  }
  function togglePart(id: string, checked: boolean) {
    const isTop = parts.find(item => item.id === id)!.role === 'top';
    // A countertop and cabinet surfaces use different finish libraries.
    const compatible = selectedParts.filter(item => (item.role === 'top') === isTop).map(item => item.id);
    selectParts(checked ? [...compatible, id] : selectedIds.filter(item => item !== id));
  }
  const quote = paletteQuotePath(design, language, window.location.hostname);
  const title = `${l.styles[scheme.style]} · ${String(scheme.variant).padStart(2, '0')}`;
  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}${studioSharePath(design, language)}`); setNotice(t.copied); }
    catch { setNotice(t.copyFailed); }
  }
  return <div ref={panel} onFocusCapture={event => { if (event.target instanceof HTMLElement) lastControl.current = event.target; }} className={`studio-package-detail studio-product${zoom ? ' is-zoomed' : ''}`} data-package-detail={design.scheme} data-mode={editing ? 'colours' : 'details'}>
    <header className="studio-product__heading"><div><p>{editing ? p.colours : p.original}</p><h2>{title}</h2></div>{editing && !zoom && <button type="button" className="studio-product__back" onClick={onDetails}><ArrowLeft size={14} aria-hidden="true" />{p.original}</button>}</header>
    <div className="studio-product__layout">
      <div className="studio-product__visual"><div className="studio-product__spaces studio-room-tabs" aria-label={t.space}>{paletteRooms(design.scheme).map(room => <button key={room} aria-pressed={preview.scene === room} onClick={() => { onScene(room); setExpanded(false); }}>{l.scenes[room]}</button>)}<button className="studio-product__zoom" aria-label={zoom ? p.closeZoom : t.zoom} title={zoom ? p.closeZoom : t.zoom} aria-pressed={zoom} onClick={() => setZoom(!zoom)}><ZoomIn size={16} aria-hidden="true" /><span>{zoom ? p.closeZoom : t.zoom}</span></button></div>
        <Suspense fallback={<p className="studio-room-loading" role="status">{t.loading}</p>}><RoomPreview design={preview} /></Suspense>
        <p className="studio-product__note">{p.previewNote}</p>
        {!paletteRooms(design.scheme).includes(design.scene) && <p className="studio-product__note" role="status">{p.roomFallback}</p>}
      </div>
      <div className="studio-product__options">
        {editing ? <section className="studio-palette" aria-label={p.colours}>
          <fieldset className="studio-parts">
            <legend>{p.part}<span>{p.multiSelect}</span></legend>
            <div className="studio-parts__shortcuts"><button type="button" aria-pressed={matches(fronts)} onClick={() => selectParts(fronts.map(item => item.id))}>{p.doorsOnly}</button><button type="button" aria-pressed={matches(cabinetParts)} onClick={() => selectParts(cabinetParts.map(item => item.id))}>{p.selectCabinetParts}</button></div>
            <details>
              <summary><span>{selectionLabel || p.chooseParts}</span><ChevronDown size={16} /></summary>
              <div className="studio-parts__list" role="group" aria-label={p.part}>
                {cabinetParts.map(item => <label key={item.id}><input type="checkbox" data-part={item.id} checked={selectedIds.includes(item.id)} onChange={e => togglePart(item.id, e.target.checked)} /><span>{partName(item.id)}</span></label>)}
                {tops.length > 0 && <div className="studio-parts__tops">{tops.map(item => <label key={item.id}><input type="checkbox" data-part={item.id} checked={selectedIds.includes(item.id)} onChange={e => togglePart(item.id, e.target.checked)} /><span>{partName(item.id)}</span></label>)}<p>{p.worktopSeparate}</p></div>}
              </div>
            </details>
          </fieldset>
          <p className="studio-palette__selection"><span>{selectedParts.length ? p.selectedParts.replace('{count}', String(selectedParts.length)) : p.chooseParts}</span><strong>{selectedParts.length ? selectedFinish ? l.finishes[selectedFinish] : p.mixedColours : ''}</strong></p>
          <div id={finishGridId} className="studio-finish-grid">{choices.map(f => <button key={f.id} data-finish={f.id} disabled={!selectedParts.length} aria-pressed={selectedFinish === f.id} aria-label={l.finishes[f.id]} onClick={() => onFinish(selectedParts.map(item => item.id), f.id)}><span><FinishSwatch finish={f.id} />{selectedFinish === f.id && <Check size={16} />}</span><span>{l.finishes[f.id]}</span></button>)}</div>
          <div className="studio-palette__actions">
            {finishes.length > 6 && <button type="button" className="studio-palette__action studio-palette__action--toggle" aria-expanded={expanded} aria-controls={finishGridId} onClick={() => setExpanded(!expanded)}>{expanded ? p.less : p.more}<ChevronDown size={15} aria-hidden="true" /></button>}
            <button type="button" className="studio-palette__action studio-palette__action--reset" onClick={onRestore}><RotateCcw size={15} aria-hidden="true" />{p.restore}</button>
          </div>
        </section> : <><StudioPrice design={design} compact /><Button className="studio-customize" onClick={onStart}>{p.customize}<ArrowRight size={16} /></Button>
          <section className="studio-product__included"><h3>{p.included}</h3><p>{includedKinds.map(kind => l.kinds[kind]).join(' · ')}</p></section>
          <div className="studio-package-finishes">{(['front', 'body'] as const).map(role => {
            const values = [...new Set(parts.filter(item => item.role === role).map(item => item.finish))];
            const finish = values.length === 1 ? values[0] : null;
            return <div key={role}>{finish && <FinishSwatch finish={finish} />}<span>{finish ? l.finishes[finish] : p.mixedColours}</span><small>{l.roles[role]}</small></div>;
          })}</div>
        </>}
        <details className="studio-product__specs"><summary>{offer?.status === 'draft' ? p.proposedSpecs : t.specifications}</summary>{offer ? <><p>{t.specOrder}</p><dl>{offer.specs.map(c => <div key={c.id}><dt>{l.kinds[c.id]}</dt><dd>{c.widthFt} {t.ft} × {c.heightMm} {t.mm} × {c.depthMm} {t.mm}</dd></div>)}</dl><p>{pricingText[language].basis}</p><p>{pricingText[language].scope}</p></> : <p>{p.specsOnRequest}</p>}<p>{p.extraRequest}</p></details>
        {hasLegacyGeometry(design) && <p className="studio-product__note">{p.legacyNote}</p>}
        <details className="studio-fee-details"><summary>{t.feeDetails}</summary><p>{t.priceScope}</p><p>{t.visualScope}</p><p>{t.finishNote}</p></details>
        <div className="studio-product__tools"><Button variant="outline" onClick={() => setNotice(onSave() ? t.savedOk : t.saveFailed)} aria-pressed={saved}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{t.save}</Button><Button variant="outline" aria-label={t.share} onClick={() => void share()}><Copy size={16} />{p.copyLink}</Button></div>
        <p className="studio-live" role="status">{storageError ? t.saveFailed : notice}</p>
      </div>
    </div>
    <footer className="studio-product__footer">{editing && <StudioPrice design={design} compact summary />}{quote && <Button asChild className="studio-consult"><LocalizedLink to={quote} aria-label={p.consult} aria-describedby={promotionNoteId} onClick={() => trackEvent('cabinet_quote_start', { style_id:design.style, package_id:design.scheme })}><span className="studio-consult__copy"><span>{p.consult}</span><small id={promotionNoteId}>{p.promotionPeriod}</small></span><ArrowRight size={16} aria-hidden="true" /></LocalizedLink></Button>}</footer>
  </div>;
}
