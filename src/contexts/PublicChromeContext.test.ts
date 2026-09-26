import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getInitialPublicTheme, PublicChromeProvider, usePageConsultation, usePublicChrome } from "@/contexts/PublicChromeContext";

describe("public theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("uses the fixed dark public theme", () => {
    expect(getInitialPublicTheme()).toBe("dark");
  });

  it("ignores obsolete saved light preferences", () => {
    window.localStorage.setItem("flashcast-public-theme", "light");

    expect(getInitialPublicTheme()).toBe("dark");
  });
});

describe("page consultation ownership", () => {
  it("restores the shared invitation after route changes and cleans up overlapping registrations", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const PageConsultation = () => { usePageConsultation(); return null; };
    const SharedInvitation = () => {
      const { hasPageConsultation } = usePublicChrome();
      return hasPageConsultation ? null : createElement("p", null, "Shared invitation");
    };
    const renderPage = (routeKey: string, count: number) => act(() => root.render(
      createElement(StrictMode, null,
        createElement(PublicChromeProvider, {
          isAdminRoute: false,
          routeKey,
          children: [
            ...Array.from({ length: count }, (_, index) => createElement(PageConsultation, { key: `${routeKey}-${index}` })),
            createElement(SharedInvitation, { key: "shared" }),
          ],
        }),
      ),
    ));

    renderPage("home", 0);
    expect(container).toHaveTextContent("Shared invitation");
    renderPage("services", 2);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("services", 1);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("kitchen", 1);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("about", 0);
    expect(container).toHaveTextContent("Shared invitation");
    act(() => root.unmount());
  });
});
