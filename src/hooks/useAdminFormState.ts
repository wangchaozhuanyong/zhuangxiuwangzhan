import { useCallback, useEffect, useRef, useState } from "react";

type Options<T> = {
  /** When this changes (e.g. record id), form re-syncs from remote and dirty is cleared. */
  resetKey?: string | number | null;
  /** Initial state before remote loads. */
  initial?: T;
};

/**
 * Keeps local admin form state in sync with react-query data without clobbering in-progress edits.
 */
export function useAdminFormState<T>(remote: T | undefined, options: Options<T> = {}) {
  const { resetKey = "", initial } = options;
  const [state, setState] = useState<T>(() => (remote ?? initial) as T);
  const dirtyRef = useRef(false);
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      dirtyRef.current = false;
    }
  }, [resetKey]);

  useEffect(() => {
    if (remote === undefined) return;
    if (dirtyRef.current) return;
    setState(remote);
  }, [remote, resetKey]);

  const setForm = useCallback((value: T | ((prev: T) => T)) => {
    dirtyRef.current = true;
    setState(value);
  }, []);

  const applyRemote = useCallback((value: T) => {
    dirtyRef.current = false;
    setState(value);
  }, []);

  const markPristine = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  const isDirty = useCallback(() => dirtyRef.current, []);

  return { state, setForm, applyRemote, markPristine, isDirty };
}
