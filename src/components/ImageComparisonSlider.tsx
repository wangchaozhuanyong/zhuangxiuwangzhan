import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type ImageComparisonSliderProps = {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  initialValue: number;
  max?: number;
  min?: number;
  positionVariable: `--${string}`;
};

type ComparisonBounds = {
  left: number;
  width: number;
};

type ActivePointer = {
  dragging: boolean;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
};

const DRAG_INTENT_THRESHOLD = 6;

export const calculateComparisonPosition = (
  clientX: number,
  bounds: ComparisonBounds,
  min: number,
  max: number,
) => {
  if (bounds.width <= 0) return min;
  const percentage = ((clientX - bounds.left) / bounds.width) * 100;
  return Math.round(Math.min(max, Math.max(min, percentage)));
};

const ImageComparisonSlider = ({
  ariaLabel,
  children,
  className,
  initialValue,
  max = 100,
  min = 0,
  positionVariable,
}: ImageComparisonSliderProps) => {
  const [position, setPosition] = useState(() => Math.min(max, Math.max(min, initialValue)));
  const activePointerRef = useRef<ActivePointer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePosition = (clientX: number, element: HTMLDivElement) => {
    const bounds = element.getBoundingClientRect();
    setPosition(calculateComparisonPosition(clientX, bounds, min, max));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    activePointerRef.current = {
      dragging: event.pointerType === "mouse",
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
    };
    inputRef.current?.focus({ preventScroll: true });
    if (event.pointerType === "mouse") updatePosition(event.clientX, event.currentTarget);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Older mobile engines can reject capture while still delivering pointer events.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activePointer = activePointerRef.current;
    if (!activePointer || activePointer.pointerId !== event.pointerId) return;

    if (!activePointer.dragging) {
      const distanceX = event.clientX - activePointer.startX;
      const distanceY = event.clientY - activePointer.startY;

      if (
        activePointer.pointerType === "touch"
        && Math.abs(distanceY) > DRAG_INTENT_THRESHOLD
        && Math.abs(distanceY) > Math.abs(distanceX)
      ) {
        activePointerRef.current = null;
        return;
      }

      if (Math.abs(distanceX) < DRAG_INTENT_THRESHOLD) return;
      activePointer.dragging = true;
    }

    if (event.cancelable) event.preventDefault();
    updatePosition(event.clientX, event.currentTarget);
  };

  const clearPointerInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current?.pointerId !== event.pointerId) return;
    activePointerRef.current = null;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Capture may already be released after pointercancel on mobile browsers.
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activePointer = activePointerRef.current;
    if (!activePointer || activePointer.pointerId !== event.pointerId) return;
    if (!activePointer.dragging) updatePosition(event.clientX, event.currentTarget);
    clearPointerInteraction(event);
  };

  const sliderStyle = { [positionVariable]: `${position}%` } as CSSProperties;

  return (
    <div
      className={className}
      style={sliderStyle}
      data-cinematic-media
      onDragStart={(event) => event.preventDefault()}
      onPointerCancel={clearPointerInteraction}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={(event) => {
        if (activePointerRef.current?.pointerId === event.pointerId) activePointerRef.current = null;
      }}
    >
      {children}
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        value={position}
        aria-label={ariaLabel}
        aria-valuetext={`${position}%`}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  );
};

export default ImageComparisonSlider;
