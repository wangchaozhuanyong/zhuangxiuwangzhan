import { useLayoutEffect, useRef, useState } from "react";
import { PUBLIC_LOADING_PROGRESS, startPublicLoadingProgress } from "@/lib/publicLoadingProgress";
import { prefersReducedMotion } from "@/lib/publicMotion";

/** Retain an already-visible bar for its completion; never delay route readiness. */
export function PublicLoadingBar({ complete, onFinished }: { complete: boolean; onFinished?: () => void }) {
  const track = useRef<HTMLElement>(null);
  const progress = useRef<ReturnType<typeof startPublicLoadingProgress>>();
  const finished = useRef(onFinished);
  finished.current = onFinished;
  const [fading, setFading] = useState(false);
  useLayoutEffect(() => {
    if (!track.current) return;
    const controller = startPublicLoadingProgress(track.current);
    progress.current = controller;
    return () => { controller.cancel(); progress.current = undefined; };
  }, []);
  useLayoutEffect(() => {
    if (!complete) return;
    let stopped = false;
    let timer = 0;
    void progress.current?.complete().then(() => {
      if (stopped) return;
      if (prefersReducedMotion()) { finished.current?.(); return; }
      setFading(true);
      timer = window.setTimeout(() => finished.current?.(), PUBLIC_LOADING_PROGRESS.fade);
    });
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [complete]);
  return <i ref={track} aria-hidden="true" data-loading-progress="true"
    data-progress-state={fading ? "fading" : complete ? "complete" : "waiting"} />;
}
