import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cloneDesign, decodeDesign, encodeDesign, parseStudio, storageKey, studioParams, validateSaved, type SavedDesign, type StudioDesign } from '@/lib/cabinetStudio';

export function useCabinetStudio() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const parsed = useMemo(() => parseStudio(params), [params]);
  const [pending, setPending] = useState<{ query: string; design: StudioDesign } | null>(null);
  const design = pending?.query === query ? pending.design : parsed.design;
  const history = useRef<{ past: StudioDesign[]; future: StudioDesign[] }>({ past: [], future: [] });
  const [historyRevision, setHistoryRevision] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const [saved, setSaved] = useState<SavedDesign[]>(() => {
    try { return validateSaved(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { return []; }
  });
  const [lastDraft] = useState(() => {
    try { return decodeDesign(localStorage.getItem(`${storageKey}.draft`) || ''); } catch { return null; }
  });
  if (pending && pending.query !== query) setPending(null);
  useEffect(() => {
    const pop = () => { setPending(null); history.current = { past: [], future: [] }; setHistoryRevision(r => r + 1); };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  const view = ['inspire', 'design', 'saved'].includes(params.get('view') ?? '') ? params.get('view')! : params.has('d') || ['o', 'p', 's', 'c', 'm', 'r'].some(k => params.has(k)) ? 'design' : 'inspire';
  function update(next: StudioDesign, record = true, start = false) {
    if (record) history.current = { past: [...history.current.past, cloneDesign(design)].slice(-40), future: [] };
    setPending({ query, design: next });
    setHistoryRevision(r => r + 1);
    const nextParams = studioParams(next, params);
    nextParams.set('view', 'design');
    nextParams.set('pick', next.scheme);
    if (start) nextParams.delete('step');
    setParams(nextParams, { preventScrollReset: true });
    try { localStorage.setItem(`${storageKey}.draft`, encodeDesign(next)); setStorageError(false); } catch { setStorageError(true); }
  }
  function undo() {
    const next = history.current.past[history.current.past.length - 1]; if (!next) return;
    history.current = { past: history.current.past.slice(0, -1), future: [cloneDesign(design), ...history.current.future] };
    update(next, false);
  }
  function redo() {
    const next = history.current.future[0]; if (!next) return;
    history.current = { past: [...history.current.past, cloneDesign(design)], future: history.current.future.slice(1) };
    update(next, false);
  }
  function persist(next: SavedDesign[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next.map(item => ({ id: item.id, name: item.name, updated: item.updated, encoded: encodeDesign(item.design) }))));
      setSaved(next); setStorageError(false); return true;
    } catch { setStorageError(true); return false; }
  }
  function save(value: StudioDesign, name: string, id: string = crypto.randomUUID()) {
    if (!name.trim() || saved.length >= 100 && !saved.some(item => item.id === id)) { setStorageError(true); return false; }
    const item = { id, name: name.trim().slice(0, 80), design: cloneDesign(value), updated: Date.now() };
    return persist([item, ...saved.filter(s => s.id !== id)]);
  }
  function remove(id: string) { return persist(saved.filter(item => item.id !== id)); }
  function setView(next: string) {
    const p = studioParams(design, params); p.set('view', next);
    if (view === 'inspire') { try { sessionStorage.setItem(`${storageKey}.scroll`, String(window.scrollY)); } catch { /* Scroll restoration remains optional. */ } }
    setParams(p, { preventScrollReset: true });
  }
  function setStep(step: 'palette' | 'summary') {
    const p = studioParams(design, params); p.set('view', 'design');
    if (step === 'summary') p.set('step', step); else p.delete('step');
    setParams(p, { preventScrollReset: true });
  }
  function selectPackage(id: string | null) {
    const p = new URLSearchParams(params);
    if (id) p.set('pick', id); else p.delete('pick');
    p.set('view', 'inspire'); setParams(p, { preventScrollReset: true });
  }
  function filter(key: string | Record<string, string>, value = '') {
    const p = new URLSearchParams(params);
    const changes = typeof key === 'string' ? { [key]: value } : key;
    for (const [name, next] of Object.entries(changes)) { if (next) p.set(name, next); else p.delete(name); }
    if (!('limit' in changes)) { p.delete('limit'); p.delete('pick'); }
    p.set('view', 'inspire'); setParams(p, { preventScrollReset: true });
  }
  function openDetails(value: StudioDesign, editing = false) {
    const p = studioParams(value, params);
    p.set('pick', value.scheme); p.set('view', editing ? 'design' : 'inspire'); p.delete('step');
    setParams(p, { preventScrollReset: true });
  }
  function closePanel() {
    const p = new URLSearchParams(params);
    p.delete('pick'); p.delete('step'); p.set('view', 'inspire');
    setParams(p, { preventScrollReset: true });
  }
  return { design, params, view, step: params.get('step') === 'summary' ? 'summary' as const : 'palette' as const, update, setView, setStep, selectPackage, openDetails, closePanel, filter, undo, redo, canUndo: historyRevision >= 0 && history.current.past.length > 0, canRedo: history.current.future.length > 0, saved, save, remove, lastDraft, storageError, recovered: parsed.recovered };
}
export type CabinetStudioState = ReturnType<typeof useCabinetStudio>;
