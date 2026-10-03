import { useCallback, useEffect, useRef, useState } from "react";
/** Locks each operation synchronously, including validation before its first await. */
export function useSubmissionLock() {
  const active = useRef(new Set<string>());
  const queues = useRef(new Map<string, Promise<unknown>>());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const protectSubmission = useCallback(<Args extends unknown[], Result>(key: string, action: (...args: Args) => Promise<Result>) => async (...args: Args) => {
    if (active.current.has(key)) return;
    active.current.add(key);
    setIsSubmitting(true);
    try { return await action(...args); }
    finally { active.current.delete(key); if (mounted.current) setIsSubmitting(active.current.size > 0 || queues.current.size > 0); }
  }, []);
  // Autosave cannot drop a second blur while the first patch is being written.
  // Serialize patches for one record; each acknowledgement keeps later edits.
  const queueSubmission = useCallback(<Args extends unknown[], Result>(key: string, action: (...args: Args) => Promise<Result>) => (...args: Args) => {
    const previous = queues.current.get(key) || Promise.resolve();
    setIsSubmitting(true);
    const pending = previous.catch(() => undefined).then(() => action(...args));
    queues.current.set(key, pending);
    return pending.finally(() => {
      if (queues.current.get(key) === pending) queues.current.delete(key);
      if (mounted.current) setIsSubmitting(active.current.size > 0 || queues.current.size > 0);
    });
  }, []);
  return { protectSubmission, queueSubmission, isSubmitting };
}
