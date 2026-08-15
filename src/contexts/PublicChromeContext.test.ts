import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getInitialPublicTheme } from "@/contexts/PublicChromeContext";

describe("public theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("defaults to dark when the visitor has no saved preference", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);

    expect(getInitialPublicTheme()).toBe("dark");
  });

  it("keeps a visitor's saved light preference", () => {
    window.localStorage.setItem("flashcast-public-theme", "light");

    expect(getInitialPublicTheme()).toBe("light");
  });
});
