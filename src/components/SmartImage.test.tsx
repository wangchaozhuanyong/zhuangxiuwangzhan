import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import SmartImage from "@/components/SmartImage";

describe("SmartImage", () => {
  it("waits for the selected candidate to decode and retains it while a replacement loads", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onLoad = vi.fn();
    await act(async () => root.render(<SmartImage src="/first.webp" alt="First" critical onLoad={onLoad} />));

    let image = container.querySelector<HTMLImageElement>(".smart-image");
    let finishDecode: (() => void) | undefined;
    Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/selected-first.webp" });
    Object.defineProperty(image, "decode", { configurable: true, value: () => new Promise<void>((resolve) => { finishDecode = resolve; }) });
    await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("loading");
    expect(onLoad).not.toHaveBeenCalled();

    await act(async () => finishDecode?.());
    expect(image?.dataset.imageState).toBe("loaded");
    expect(onLoad).toHaveBeenCalledOnce();

    await act(async () => root.render(<SmartImage src="/second.webp" alt="Second" critical onLoad={onLoad} />));
    image = container.querySelector<HTMLImageElement>(".smart-image");
    expect(image?.dataset.imageState).toBe("loading");
    expect(container.querySelector<HTMLImageElement>(".smart-image-previous")?.src).toBe("https://example.com/selected-first.webp");

    Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/selected-second.webp" });
    Object.defineProperty(image, "decode", { configurable: true, value: () => Promise.resolve() });
    await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("loaded");
    expect(container.querySelector(".smart-image-previous")).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  it.each(["critical", "ordinary"] as const)("shows a retry action for failed %s images", async (mode) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<SmartImage src="/broken.webp" alt="Broken" critical={mode === "critical"} showFailureFallback={mode === "ordinary"} />));
    const image = container.querySelector<HTMLImageElement>(".smart-image");
    await act(async () => image?.dispatchEvent(new Event("error", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("error");
    expect(container.querySelector(".smart-image-failure button")?.textContent).toContain("Retry");
    await act(async () => (container.querySelector(".smart-image-failure button") as HTMLButtonElement).click());
    expect(container.querySelector<HTMLImageElement>(".smart-image")?.src).toContain("image_retry=");
    await act(async () => root.unmount());
    container.remove();
  });

  it("does not hide ordinary images while they load", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<SmartImage src="/logo.webp" alt="Logo" />));
    const image = container.querySelector<HTMLImageElement>("img");
    expect(image?.classList.contains("smart-image--critical")).toBe(false);
    expect(image?.dataset.imageState).toBe("loading");
    await act(async () => root.unmount());
  });
});
