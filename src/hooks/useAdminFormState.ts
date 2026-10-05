import { useCallback, useEffect, useRef, useState } from "react";

type Options<T> = { resetKey?: string | number | null; initial?: T };
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

type DeepPatch<T> = T extends readonly unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPatch<T[K]> } : T;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function mergePatch(base: unknown, patch: unknown): unknown {
  if (!object(patch)) return patch;
  const next = { ...(object(base) ? base : {}) };
  for (const [key, value] of Object.entries(patch)) next[key] = mergePatch(next[key], value);
  return next;
}
function reconcilePatch(current: unknown, submitted: unknown, patch: unknown): unknown {
  if (same(current, submitted)) return mergePatch(current, patch);
  if (!object(patch) || !object(current)) return current;
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) next[key] = reconcilePatch(current[key], object(submitted) ? submitted[key] : undefined, value);
  return next;
}

/** Three snapshots: last confirmed remote, submitted values, and current edits. */
export function useAdminFormState<T>(remote: T | undefined, options: Options<T> = {}) {
  const { resetKey = "", initial } = options;
  const [state, setState] = useState<T>(() => (remote ?? initial) as T);
  const current = useRef(state);
  const baseline = useRef(state);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const resetKeyRef = useRef(resetKey);
  const commit = useCallback((value: T) => {
    current.current = value;
    dirtyRef.current = !same(value, baseline.current);
    setDirty(dirtyRef.current);
    setState(value);
  }, []);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      baseline.current = (remote ?? initial) as T;
      commit(baseline.current);
    } else if (remote !== undefined && !dirtyRef.current) {
      baseline.current = remote;
      commit(remote);
    }
  }, [remote, resetKey, initial, commit]);

  const setForm = useCallback((value: T | ((prev: T) => T)) => {
    commit(typeof value === "function" ? (value as (prev: T) => T)(current.current) : value);
  }, [commit]);

  const applyRemote = useCallback((saved: T, submitted?: T) => {
    let next = saved;
    if (submitted !== undefined && !same(current.current, submitted)) {
      if (saved && submitted && current.current && typeof saved === "object" && !Array.isArray(saved)) {
        next = { ...saved };
        for (const key of Object.keys(current.current) as (keyof T)[]) {
          if (!same(current.current[key], submitted[key])) next[key] = current.current[key];
        }
      } else next = current.current;
    }
    baseline.current = saved;
    commit(next);
  }, [commit]);
  const applyPatchRemote = useCallback((patch: DeepPatch<T>, submitted: DeepPatch<T>) => {
    baseline.current = mergePatch(baseline.current, patch) as T;
    commit(reconcilePatch(current.current, submitted, patch) as T);
  }, [commit]);
  const markPristine = useCallback(() => { baseline.current = current.current; commit(current.current); }, [commit]);
  const isDirty = useCallback(() => dirtyRef.current, []);
  const getCurrent = useCallback(() => current.current, []);
  const field = <K extends keyof T>(key: K): [T[K], (value: T[K] | ((previous: T[K]) => T[K])) => void] => [
    state?.[key] as T[K],
    (value) => setForm((previous) => ({ ...previous, [key]: typeof value === "function" ? (value as (previous: T[K]) => T[K])(previous[key]) : value })),
  ];
  return { field, state: resetKeyRef.current === resetKey ? state : (remote ?? initial) as T, setForm, applyRemote, applyPatchRemote, markPristine, isDirty, getCurrent, dirty };
}
