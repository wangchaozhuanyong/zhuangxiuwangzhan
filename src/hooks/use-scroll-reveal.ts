import { useEffect, useMemo, useRef, useState } from "react";

type RevealOptions = { threshold?: number; rootMargin?: string };

type SharedObserverEntry = {
  observer: IntersectionObserver;
  callbacks: WeakMap<Element, (entry: IntersectionObserverEntry) => void>;
};

const sharedObservers = new Map<string, SharedObserverEntry>();

const canUseIntersectionObserver = () =>
  typeof window !== "undefined" && typeof window.IntersectionObserver === "function";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getObserverKey = (opts: RevealOptions) => `${opts.threshold ?? 0.08}::${opts.rootMargin ?? "0px 0px 96px 0px"}`;

const getSharedObserver = (opts: RevealOptions) => {
  const key = getObserverKey(opts);
  const existing = sharedObservers.get(key);
  if (existing) return existing;

  const callbacks = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = callbacks.get(entry.target);
        if (cb) cb(entry);
      }
    },
    {
      threshold: opts.threshold ?? 0.08,
      rootMargin: opts.rootMargin ?? "0px 0px 96px 0px",
    }
  );

  const created = { observer, callbacks };
  sharedObservers.set(key, created);
  return created;
};

/**
 * Lightweight scroll-reveal hook using Intersection Observer.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 * Once visible, stays visible (no re-hide on scroll up).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: RevealOptions
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    if (!canUseIntersectionObserver()) return true;
    return prefersReducedMotion();
  });

  const opts = useMemo(
    () => ({
      threshold: options?.threshold ?? 0.08,
      rootMargin: options?.rootMargin ?? "0px 0px 96px 0px",
    }),
    [options?.threshold, options?.rootMargin]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isVisible) return;
    if (!canUseIntersectionObserver()) {
      setIsVisible(true);
      return;
    }
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const { observer, callbacks } = getSharedObserver(opts);
    callbacks.set(el, (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        callbacks.delete(el);
        observer.unobserve(el);
      }
    });

    observer.observe(el);
    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [isVisible, opts]);

  return { ref, isVisible };
}
