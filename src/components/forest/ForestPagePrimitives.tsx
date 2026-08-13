import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowUpRight, Minus, Plus, RefreshCw } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { forestUiText } from "@/i18n/forestUiText";
import { cn } from "@/lib/utils";

export type ForestFilterItem = {
  value: string;
  label: string;
};

export function ForestSectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("forest-section-heading", className)}>
      <div className="forest-section-heading__copy">
        {eyebrow ? <p className="forest-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="forest-section-heading__action">{action}</div> : null}
    </header>
  );
}

export function ForestFilterNav({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: ForestFilterItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const animationFrameRef = useRef<number | null>(null);
  const suppressClickFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  });
  const hasPositionedInitialValueRef = useRef(false);
  const [overflow, setOverflow] = useState({ start: false, end: false });
  const itemsKey = items.map((item) => `${item.value}:${item.label}`).join("|");

  const updateOverflow = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const next = { start: rail.scrollLeft > 4, end: rail.scrollLeft < maxScroll - 4 };
    setOverflow((current) => current.start === next.start && current.end === next.end ? current : next);
  }, []);

  const stopRailAnimation = useCallback(() => {
    if (animationFrameRef.current === null) return;
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const updateActiveIndicator = useCallback((item: HTMLButtonElement | undefined) => {
    const rail = railRef.current;
    if (!rail || !item) return;
    rail.style.setProperty("--forest-filter-active-x", `${item.offsetLeft}px`);
    rail.style.setProperty("--forest-filter-active-width", `${item.offsetWidth}px`);
    rail.dataset.indicatorReady = "true";
  }, []);

  const scrollRailTo = useCallback((target: number, behavior: ScrollBehavior = "smooth") => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const destination = Math.max(0, Math.min(maxScroll, target));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    stopRailAnimation();
    if (behavior === "auto" || reducedMotion || Math.abs(destination - rail.scrollLeft) < 2) {
      rail.scrollLeft = destination;
      updateOverflow();
      return;
    }

    const start = rail.scrollLeft;
    const distance = destination - start;
    const startedAt = performance.now();
    const duration = Math.min(480, Math.max(300, Math.abs(distance) * 0.78));

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      rail.scrollLeft = start + distance * eased;
      if (progress < 1) animationFrameRef.current = window.requestAnimationFrame(animate);
      else {
        animationFrameRef.current = null;
        updateOverflow();
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [stopRailAnimation, updateOverflow]);

  const centerItem = useCallback((item: HTMLButtonElement | undefined, behavior: ScrollBehavior = "smooth") => {
    const rail = railRef.current;
    if (!rail || !item) return;
    scrollRailTo(item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2, behavior);
  }, [scrollRailTo]);

  const glideRail = useCallback((initialVelocity: number) => {
    const rail = railRef.current;
    if (!rail) return;
    stopRailAnimation();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(initialVelocity) < 0.02) {
      updateOverflow();
      return;
    }

    let velocity = initialVelocity;
    let previousTime = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(32, now - previousTime);
      previousTime = now;
      rail.scrollLeft += velocity * elapsed;
      velocity *= Math.pow(0.92, elapsed / 16.667);

      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const atBoundary = (rail.scrollLeft <= 0 && velocity < 0) || (rail.scrollLeft >= maxScroll && velocity > 0);
      if (Math.abs(velocity) > 0.018 && !atBoundary) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        updateOverflow();
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [stopRailAnimation, updateOverflow]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    stopRailAnimation();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const distance = drag.startX - event.clientX;
    if (!drag.moved && Math.abs(distance) > 4) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    if (!drag.moved) return;

    event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocity = (drag.lastX - event.clientX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    event.currentTarget.scrollLeft = drag.startScrollLeft + distance;
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLDivElement>, withMomentum: boolean) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== event.pointerId) return;

    event.currentTarget.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.pointerId = null;

    if (!drag.moved) return;
    suppressClickRef.current = true;
    if (suppressClickFrameRef.current !== null) window.cancelAnimationFrame(suppressClickFrameRef.current);
    suppressClickFrameRef.current = window.requestAnimationFrame(() => {
      suppressClickRef.current = false;
      suppressClickFrameRef.current = null;
    });
    if (withMomentum) glideRail(drag.velocity);
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const resizeObserver = new ResizeObserver(() => {
      updateOverflow();
      updateActiveIndicator(itemRefs.current.get(value));
    });
    resizeObserver.observe(rail);
    itemRefs.current.forEach((item) => resizeObserver.observe(item));
    updateOverflow();
    return () => resizeObserver.disconnect();
  }, [itemsKey, updateActiveIndicator, updateOverflow, value]);

  useEffect(() => {
    const activeItem = itemRefs.current.get(value);
    updateActiveIndicator(activeItem);
    centerItem(activeItem, hasPositionedInitialValueRef.current ? "smooth" : "auto");
    hasPositionedInitialValueRef.current = true;
  }, [value, itemsKey, centerItem, updateActiveIndicator]);

  useEffect(() => () => {
    stopRailAnimation();
    if (suppressClickFrameRef.current !== null) window.cancelAnimationFrame(suppressClickFrameRef.current);
  }, [stopRailAnimation]);

  return (
    <div
      className={cn(
        "forest-filter-nav",
        overflow.start && "forest-filter-nav--start",
        overflow.end && "forest-filter-nav--end",
        className,
      )}
      data-scrollable={overflow.start || overflow.end ? "true" : "false"}
    >
      <div className="forest-filter-nav__viewport">
        <div
          ref={railRef}
          className="forest-filter-nav__rail"
          role="group"
          aria-label={ariaLabel}
          onScroll={updateOverflow}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => finishPointerDrag(event, true)}
          onPointerCancel={(event) => finishPointerDrag(event, false)}
          onClickCapture={(event) => {
            if (!suppressClickRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          <span className="forest-filter-nav__active-indicator" aria-hidden="true" />
          {items.map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                ref={(element) => {
                  if (element) itemRefs.current.set(item.value, element);
                  else itemRefs.current.delete(item.value);
                }}
                type="button"
                className="forest-filter-nav__item"
                aria-pressed={active}
                data-active={active ? "true" : "false"}
                onClick={() => onChange(item.value)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ForestBackLink({ to, children }: { to: string; children?: ReactNode }) {
  const { language } = useLanguage();
  return (
    <LocalizedLink to={to} className="forest-back-link">
      <ArrowLeft aria-hidden="true" />
      <span>{children || forestUiText[language].back}</span>
    </LocalizedLink>
  );
}

type ForestStateProps = {
  variant: "loading" | "error" | "empty";
  label?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ForestContentState({ variant, label, title, description, onRetry, compact = false }: ForestStateProps) {
  const { language } = useLanguage();
  const text = forestUiText[language];
  const content = {
    loading: [text.loadingLabel, text.loadingTitle, text.loadingDescription],
    error: [text.errorLabel, text.errorTitle, text.errorDescription],
    empty: [text.emptyLabel, text.emptyTitle, text.emptyDescription],
  }[variant];

  return (
    <section
      className={cn("forest-content-state", `forest-content-state--${variant}`, compact && "forest-content-state--compact")}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-busy={variant === "loading" || undefined}
    >
      <div className="forest-content-state__signal" aria-hidden="true">
        {variant === "loading" ? <span /> : variant === "error" ? <RefreshCw /> : <ArrowUpRight />}
      </div>
      <div>
        <p className="forest-eyebrow">{label || content[0]}</p>
        <h2>{title || content[1]}</h2>
        <p>{description || content[2]}</p>
      </div>
      {variant === "error" && onRetry ? (
        <button type="button" className="forest-button forest-button--outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          {text.retry}
        </button>
      ) : null}
    </section>
  );
}

export function ForestRouteSkeleton() {
  const { language } = useLanguage();
  const text = forestUiText[language];
  return (
    <main className="forest-route-skeleton pt-site-header" role="status" aria-live="polite" aria-busy="true">
      <div className="forest-route-progress" aria-hidden="true" />
      <section className="forest-route-skeleton__hero">
        <div className="forest-route-skeleton__copy">
          <span />
          <strong />
          <strong />
          <i />
        </div>
        <div className="forest-route-skeleton__media" />
      </section>
      <section className="forest-route-skeleton__body" aria-label={text.loadingTitle}>
        <p className="forest-eyebrow">{text.loadingLabel}</p>
        <h1>{text.loadingTitle}</h1>
        <p>{text.loadingDescription}</p>
        <div className="forest-route-skeleton__grid" aria-hidden="true">
          <span /><span /><span />
        </div>
      </section>
    </main>
  );
}

export function ForestAtmosphere() {
  return (
    <div className="forest-atmosphere" aria-hidden="true">
      <span className="forest-atmosphere__texture" />
      <span className="forest-atmosphere__light" />
      <span className="forest-atmosphere__grain" />
    </div>
  );
}

export function ForestFaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);

  useEffect(() => {
    setOpenIndex(items.length ? 0 : null);
  }, [items]);

  return (
    <div className="forest-faq-list">
      {items.map((item, index) => {
        const open = index === openIndex;
        const contentId = `forest-faq-answer-${index}`;
        return (
          <article key={`${item.question}-${index}`} className="forest-faq-item" data-open={open ? "true" : "false"}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span>{item.question}</span>
              {open ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
            </button>
            <div id={contentId} className="forest-faq-answer" hidden={!open}>
              <p>{item.answer}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
