import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import ImageComparisonSlider, { calculateComparisonPosition } from "@/components/ImageComparisonSlider";

const createPointerEvent = (type: string, pointerId: number, clientX: number, clientY = 50) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
    isPrimary: { value: true },
    pointerId: { value: pointerId },
    pointerType: { value: "touch" },
  });
  return event;
};

describe("ImageComparisonSlider", () => {
  it("maps pointer positions into the configured range", () => {
    expect(calculateComparisonPosition(-20, { left: 20, width: 200 }, 8, 92)).toBe(8);
    expect(calculateComparisonPosition(120, { left: 20, width: 200 }, 8, 92)).toBe(50);
    expect(calculateComparisonPosition(260, { left: 20, width: 200 }, 8, 92)).toBe(92);
  });

  it("supports another touch drag after pointerup and pointercancel", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ImageComparisonSlider
          ariaLabel="Compare images"
          className="comparison"
          initialValue={50}
          positionVariable="--compare-position"
        >
          <span>Images</span>
        </ImageComparisonSlider>,
      );
    });

    const slider = container.querySelector<HTMLDivElement>(".comparison");
    const input = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider).not.toBeNull();
    expect(input).not.toBeNull();
    if (!slider || !input) return;

    let capturedPointer: number | null = null;
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      bottom: 100,
      height: 100,
      left: 20,
      right: 220,
      top: 0,
      width: 200,
      x: 20,
      y: 0,
      toJSON: () => ({}),
    });
    slider.setPointerCapture = vi.fn((pointerId) => { capturedPointer = pointerId; });
    slider.hasPointerCapture = vi.fn((pointerId) => capturedPointer === pointerId);
    slider.releasePointerCapture = vi.fn((pointerId) => {
      if (capturedPointer === pointerId) capturedPointer = null;
    });

    act(() => {
      slider.dispatchEvent(createPointerEvent("pointerdown", 1, 60));
      slider.dispatchEvent(createPointerEvent("pointermove", 1, 180));
      slider.dispatchEvent(createPointerEvent("pointerup", 1, 180));
    });
    expect(input.value).toBe("80");

    act(() => {
      slider.dispatchEvent(createPointerEvent("pointerdown", 2, 160));
      slider.dispatchEvent(createPointerEvent("pointercancel", 2, 160));
      slider.dispatchEvent(createPointerEvent("pointerdown", 3, 140));
      slider.dispatchEvent(createPointerEvent("pointermove", 3, 100));
      slider.dispatchEvent(createPointerEvent("pointerup", 3, 100));
    });
    expect(input.value).toBe("40");

    act(() => root.unmount());
    container.remove();
  });

  it("leaves vertical touch movement available for page scrolling", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ImageComparisonSlider
          ariaLabel="Compare images"
          className="comparison"
          initialValue={48}
          positionVariable="--compare-position"
        >
          <span>Images</span>
        </ImageComparisonSlider>,
      );
    });

    const slider = container.querySelector<HTMLDivElement>(".comparison");
    const input = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider).not.toBeNull();
    expect(input).not.toBeNull();
    if (!slider || !input) return;

    slider.setPointerCapture = vi.fn();
    slider.hasPointerCapture = vi.fn(() => true);
    slider.releasePointerCapture = vi.fn();

    const verticalMove = createPointerEvent("pointermove", 1, 122, 90);
    act(() => {
      slider.dispatchEvent(createPointerEvent("pointerdown", 1, 120, 50));
      slider.dispatchEvent(verticalMove);
      slider.dispatchEvent(createPointerEvent("pointerup", 1, 122, 90));
    });

    expect(verticalMove.defaultPrevented).toBe(false);
    expect(input.value).toBe("48");

    act(() => root.unmount());
    container.remove();
  });
});
