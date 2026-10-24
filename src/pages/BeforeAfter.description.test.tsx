import { act, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BeforeAfter from "./BeforeAfter";
import { beforeAfterPageText } from "@/i18n/beforeAfterPageText";
import { beforeAfterFallbackMedia } from "@/data/beforeAfterFallback";
import type { PublishedBeforeAfterItem } from "@/lib/homeContentApi";

const fixture = vi.hoisted(() => ({ language: "en" as "zh" | "en" | "ms", item: null as PublishedBeforeAfterItem | null }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedBeforeAfterItems: () => ({ data: [fixture.item] }) }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));
vi.mock("@/components/PublicResultsBoundary", () => ({ default: ({ children }: PropsWithChildren) => <>{children}</> }));
vi.mock("@/components/ImageComparisonSlider", () => ({ default: ({ children }: PropsWithChildren) => <div>{children}</div> }));
vi.mock("@/components/DeferredSmartImage", () => ({ DeferredSmartImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({ SchemeARouteHero: () => null, SchemeASection: ({ children }: PropsWithChildren) => <section>{children}</section> }));
let root: Root | undefined; let node: HTMLDivElement;
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; node?.remove(); vi.unstubAllGlobals(); });
const render = (description: string, reviewed = false) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixture.item = { id: "synthetic-comparison", title: "Synthetic title", description, location: "Synthetic district", alt: "Synthetic images",
    before_image_url: reviewed ? beforeAfterFallbackMedia[0].before_image_url : "/synthetic-before.webp",
    after_image_url: reviewed ? beforeAfterFallbackMedia[0].after_image_url : "/synthetic-after.webp" };
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  act(() => root!.render(<MemoryRouter><BeforeAfter /></MemoryRouter>));
};

describe("published comparison description delivery", () => {
  it.each(["zh", "en", "ms"] as const)("displays the saved custom description in %s", language => {
    fixture.language = language; render(`Saved custom comparison description ${language}`);
    expect(node.querySelector(".scheme-a-transformation__description")).toHaveTextContent(`Saved custom comparison description ${language}`);
  });
  it("keeps the current fallback when the custom description is empty", () => {
    fixture.language = "en"; render(""); expect(node.querySelector(".scheme-a-transformation__description")).toHaveTextContent(beforeAfterPageText.en.itemDescription);
  });
  it("preserves approved copy for the existing reviewed fallback photographs", () => {
    fixture.language = "en"; render("Unreviewed legacy copy", true);
    expect(node.querySelector(".scheme-a-transformation__description")).toHaveTextContent(beforeAfterPageText.en.itemDescription);
    expect(node).not.toHaveTextContent("Unreviewed legacy copy");
  });
});
