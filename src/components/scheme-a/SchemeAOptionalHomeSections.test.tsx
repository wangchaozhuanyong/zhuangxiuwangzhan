import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import SchemeAOptionalHomeSections from "./SchemeAOptionalHomeSections";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";

const fixture = vi.hoisted(() => ({ language: "ms" as "zh" | "en" | "ms" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
let node: HTMLDivElement; let root: Root | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; node?.remove(); vi.unstubAllGlobals(); });

const render = (section: "brand_partners" | "testimonials" | null) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const content = {
    brandPartnersEnabled: section === "brand_partners", testimonialsEnabled: section === "testimonials",
    brandPartners: [{ id: "synthetic-brand", name: "Synthetic brand", logo_url: "/brand.webp" }],
    testimonials: [{ id: "synthetic-review", client: "Synthetic reviewer", text: "Synthetic review body" }],
  } as PublishedHomeContentBundle;
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  act(() => root!.render(<SchemeAOptionalHomeSections content={content} />));
};

describe("optional public homepage sections support all three languages", () => {
  it.each([
    ["zh", "brand_partners", "品牌合作"], ["en", "brand_partners", "Brand partners"], ["ms", "brand_partners", "Rakan jenama"],
    ["zh", "testimonials", "客户评价"], ["en", "testimonials", "Testimonials"], ["ms", "testimonials", "Ulasan pelanggan"],
  ] as const)("renders enabled %s %s without a locale crash", (language, section, title) => {
    fixture.language = language; render(section);
    expect(node.querySelector("h2")).toHaveTextContent(title);
    expect(node.querySelectorAll("section")).toHaveLength(1);
    expect(node).toHaveTextContent(section === "brand_partners" ? "Synthetic brand" : "Synthetic review body");
  });
  it("retains disabled-section behavior on Malay pages", () => {
    fixture.language = "ms"; render(null); expect(node).toBeEmptyDOMElement();
  });
});
