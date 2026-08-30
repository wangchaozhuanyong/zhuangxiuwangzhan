import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import SmartImage from "@/components/SmartImage";

describe("SmartImage", () => {
  it("exposes a stable loading state and reveals after load", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onLoad = vi.fn();
    const onError = vi.fn();

    act(() => {
      root.render(<SmartImage src="/first.webp" alt="First" revealOnLoad onLoad={onLoad} onError={onError} />);
    });

    let image = container.querySelector<HTMLImageElement>("img");
    expect(image?.dataset.imageState).toBe("loading");
    expect(image?.classList.contains("smart-image--reveal")).toBe(true);

    act(() => image?.dispatchEvent(new Event("load", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("loaded");
    expect(onLoad).toHaveBeenCalledOnce();

    act(() => {
      root.render(<SmartImage src="/second.webp" alt="Second" revealOnLoad onLoad={onLoad} onError={onError} />);
    });

    image = container.querySelector<HTMLImageElement>("img");
    expect(image?.dataset.imageState).toBe("loading");

    act(() => image?.dispatchEvent(new Event("error", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("error");
    expect(onError).toHaveBeenCalledOnce();

    act(() => root.unmount());
    container.remove();
  });

  it("keeps legacy images immediately visible unless reveal is requested", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => root.render(<SmartImage src="/logo.webp" alt="Logo" />));
    const image = container.querySelector<HTMLImageElement>("img");

    expect(image?.dataset.imageState).toBeUndefined();
    expect(image?.classList.contains("smart-image--reveal")).toBe(false);

    act(() => root.unmount());
  });
});
