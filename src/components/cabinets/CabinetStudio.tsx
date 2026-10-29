import { lazy, Suspense, useRef, useState } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/cabinetStudioText.json';
import copy from '@/i18n/cabinetPaletteText.json';
import labels from '@/i18n/cabinetStudioCatalog.json';
import { studioSchemes, studioStyles, studioImage, schemeById, type StudioScene } from '@/data/cabinetStudio';
import { useCabinetStudio } from '@/hooks/useCabinetStudio';
import { designForScheme, encodeDesign, savedDesignName, type StudioDesign } from '@/lib/cabinetStudio';
import { changePaletteFinish, palettePreview, paletteRooms, paletteScenes, restorePalette } from '@/lib/cabinetPalette';
import { canPreviewCabinetDrafts } from '@/data/cabinetOffers';
import { trackEvent } from '@/lib/analytics';
import StudioDialog from './StudioDialog';
import { StudioPrice } from './StudioPrice';
const PackageDetails = lazy(() => import('./StudioPackageDetails'));
const RoomPreview = lazy(() => import('./CabinetRoomPreview'));

export default function CabinetStudio() {
  const state = useCabinetStudio(), { language } = useLanguage(), t = text[language], p = copy[language], l = labels[language];
  const detailTrigger = useRef<HTMLElement | null>(null);
  const galleryScroll = useRef<number | null>(null);
  const [notice, setNotice] = useState('');
  const requestedRoom = state.params.get('room') as StudioScene;
  const scene = paletteScenes.includes(requestedRoom) ? requestedRoom : 'kitchen';
  const style = state.params.get('style') ?? '';
  const limit = Math.max(12, Math.min(36, Number(state.params.get('limit')) || 12));
  const schemes = [...studioSchemes].sort((a, b) => a.variant - b.variant || Number(Boolean(b.offerId)) - Number(Boolean(a.offerId)))
    .filter(s => paletteRooms(s.id).includes(scene) && (!style || s.style === style));
  const pick = schemeById(state.params.get('pick') ?? '');
  const candidateDesign = state.view === 'design' ? state.design : pick ? state.design.scheme === pick.id ? state.design : { ...designForScheme(pick.id), scene: paletteRooms(pick.id).includes(scene) ? scene : 'kitchen' as const } : null;
  const emptyPlan = Boolean(candidateDesign && !candidateDesign.cabinets.length);
  const activeDesign = emptyPlan ? null : candidateDesign;
  const open = state.view !== 'saved' && Boolean(activeDesign);
  function rememberTrigger() { detailTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; galleryScroll.current = window.scrollY; }
  function restoreScroll() { if (galleryScroll.current !== null && window.location.pathname.endsWith('/custom-cabinets')) window.scrollTo({ top:galleryScroll.current, behavior:'instant' }); }
  function selectDetails(id: string) {
    rememberTrigger();
    const design = designForScheme(id);
    state.openDetails({ ...design, scene: paletteRooms(id).includes(scene) ? scene : 'kitchen' });
    trackEvent('cabinet_package_select', { style_id:design.style, package_id:id });
  }
  function favorite(id: string) {
    const existing = state.saved.find(item => item.id === `inspiration-${id}`), scheme = schemeById(id)!;
    const ok = existing ? state.remove(existing.id) : state.save({ ...designForScheme(id), scene }, `${l.styles[scheme.style]} · ${scheme.variant}`, `inspiration-${id}`);
    setNotice(ok ? existing ? '' : t.savedOk : t.saveFailed);
  }
  function save(design: StudioDesign) {
    const existing = state.saved.find(item => encodeDesign(item.design) === encodeDesign(design));
    const scheme = schemeById(design.scheme)!;
    return state.save(design, `${l.styles[scheme.style]} · ${scheme.variant}`, existing?.id);
  }
  return <div className="cabinet-studio cabinet-studio--simple" id="cabinet-studio-tabs">
    <h1 className="sr-only">{t.eyebrow}</h1>
    <p className="studio-live" role="status">{state.storageError ? t.saveFailed : notice || (emptyPlan ? p.emptyPlan : state.recovered ? t.recovered : '')}</p>
    <section aria-label={t.inspire} id="cabinet-packages">
      <div className="studio-catalog-tools"><div className="studio-filter studio-filter--simple">
        <label><span className="sr-only">{t.space}</span><select aria-label={t.space} value={scene} onChange={e => state.filter('room', e.target.value)}>{paletteScenes.map(room => <option value={room} key={room}>{l.scenes[room]}</option>)}</select></label>
        <label><span className="sr-only">{t.style}</span><select aria-label={t.style} value={style} onChange={e => state.filter('style', e.target.value)}><option value="">{t.allStyles}</option>{studioStyles.map(s => <option key={s.id} value={s.id}>{l.styles[s.id]}</option>)}</select></label>
        <Button className="studio-collection-entry" variant="outline" size="icon" aria-label={p.saved} title={p.saved} onClick={() => { rememberTrigger(); state.setView('saved'); }}><Heart size={18} />{state.saved.length > 0 && <span>{state.saved.length}</span>}</Button>
      </div><div className="studio-results"><p>{schemes.length} {t.count}</p>{style && <button onClick={() => state.filter('style','')}>{t.clear}</button>}</div></div>
      <div className="studio-gallery">{schemes.slice(0, limit).map((scheme, index) => {
        const design = { ...designForScheme(scheme.id), scene }, liked = state.saved.some(s => s.id === `inspiration-${scheme.id}`);
        return <article className="studio-card" key={scheme.id} data-scheme={scheme.id}>
          <button className="studio-card__image" aria-label={`${p.details} · ${l.styles[scheme.style]} ${scheme.variant}`} onClick={() => selectDetails(scheme.id)}><SmartImage src={studioImage(scheme.id, scene)} width={1536} height={1024} sizes="(max-width: 600px) 92vw, (max-width: 1179px) 46vw, 31vw" loading={index < 3 ? 'eager' : 'lazy'} revealOnLoad showFailureFallback retryOnError alt={`${l.styles[scheme.style]} · ${l.scenes[scene]}`} /></button>
          <div className="studio-card__body"><div className="studio-card__title"><h2>{l.styles[scheme.style]} <span>{String(scheme.variant).padStart(2, '0')}</span></h2><button className="studio-icon" aria-label={`${liked ? t.unfavorite : t.favorite} · ${l.styles[scheme.style]} ${scheme.variant}`} aria-pressed={liked} onClick={() => favorite(scheme.id)}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button></div>
            <p>{l.finishes[scheme.finishes.front]} · {l.finishes[scheme.finishes.body]}</p><StudioPrice design={design} compact />
            <div className="studio-card__actions"><Button variant="outline" onClick={() => selectDetails(scheme.id)}>{p.details}<ArrowRight size={16} /></Button></div>
          </div>
        </article>;
      })}</div>
      {!schemes.length && <div className="studio-empty">{t.empty}</div>}
      {limit < schemes.length && <div className="studio-more"><Button variant="outline" onClick={() => state.filter('limit', String(limit + 12))}>{t.more}</Button></div>}
    </section>
    <Dialog open={open} onOpenChange={value => { if (!value) state.closePanel(); }}><StudioDialog returnFocus={() => detailTrigger.current} onCloseAutoFocus={restoreScroll} className="studio-dialog studio-dialog--product"><DialogTitle className="sr-only">{p.original}</DialogTitle><DialogDescription className="sr-only">{p.previewNote}</DialogDescription>{activeDesign && <Suspense fallback={<p role="status">{t.loading}</p>}><PackageDetails key={activeDesign.scheme} design={activeDesign} editing={state.view === 'design'} onStart={() => state.update(activeDesign, false, true)} onDetails={() => state.openDetails(activeDesign)} onScene={room => state.openDetails({ ...activeDesign, scene:room }, state.view === 'design')} onFinish={(part, finish) => state.update(changePaletteFinish(activeDesign, part, finish))} onRestore={() => state.update(restorePalette(activeDesign))} onSave={() => save(activeDesign)} saved={state.saved.some(s => encodeDesign(s.design) === encodeDesign(activeDesign))} storageError={state.storageError} /></Suspense>}</StudioDialog></Dialog>
    <Dialog open={state.view === 'saved'} onOpenChange={value => { if (!value) state.closePanel(); }}><StudioDialog returnFocus={() => detailTrigger.current} onCloseAutoFocus={restoreScroll} className="studio-dialog studio-dialog--collection"><DialogTitle>{p.saved}</DialogTitle><DialogDescription>{p.savedNote}</DialogDescription>{!state.saved.length ? <div className="studio-empty"><Heart size={24} aria-hidden="true" /><p>{t.noSaved}</p></div> : <div className="studio-collection-list">{state.saved.map(item => <article key={item.id} data-saved-id={item.id}><Suspense fallback={<p className="studio-room-loading" role="status">{t.loading}</p>}><RoomPreview design={palettePreview(item.design)} compact /></Suspense><div><h3>{savedDesignName(item, language)}</h3><StudioPrice design={item.design} compact /><Button variant="outline" onClick={() => state.openDetails(item.design, true)}>{p.customize}<ArrowRight size={16} /></Button></div></article>)}</div>}</StudioDialog></Dialog>
    {canPreviewCabinetDrafts(window.location.hostname) && <p className="studio-draft-note">{t.draftNotice}</p>}
  </div>;
}
