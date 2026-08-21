import { afterEach, describe, expect, it, vi } from "vitest";
import {
  focusElementByIdWhenReady,
  focusElementImmediately,
  scrollWindowToImmediately,
} from "@/lib/instantScroll";

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.style.removeProperty("scroll-behavior");
  document.body.innerHTML = "";
});

describe("instantScroll", () => {
  it("overrides global smooth scrolling while resetting the window position", () => {
    document.documentElement.style.setProperty("scroll-behavior", "smooth");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    scrollWindowToImmediately(741);

    expect(scrollTo).toHaveBeenCalledWith({ top: 741, left: 0, behavior: "auto" });
    expect(document.documentElement.style.scrollBehavior).toBe("smooth");
    scrollTo.mockRestore();
  });

  it("scrolls an invalid field into view before focusing it", () => {
    const input = document.createElement("input");
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    input.scrollIntoView = scrollIntoView;
    input.focus = focus;

    focusElementImmediately(input);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
      inline: "nearest",
    });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("waits for React to render the error field before focusing it", () => {
    vi.useFakeTimers();
    const input = document.createElement("input");
    input.id = "quote-name";
    input.scrollIntoView = vi.fn();
    input.focus = vi.fn();
    document.body.append(input);

    focusElementByIdWhenReady(input.id);
    expect(input.focus).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(input.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
