import pricingText from '@/i18n/cabinetPricingText.json';
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { cabinetModules, cabinetPalettes, cabinetPreviewPath, cabinetScenes, cabinetStyleIds } from "@/data/customCabinets";
import { cabinetOffers, cabinetOfferSelection, matchingCabinetOffer, canPreviewCabinetDrafts, visibleCabinetOffer } from "@/data/cabinetOffers";
import text from "@/i18n/customCabinetsText.json";
import { cabinetQuotePath, cabinetSelectionParams, changeCabinetStyle, parseCabinetSelection } from "@/lib/customCabinetSelection";

const select = (query = "") => parseCabinetSelection(new URLSearchParams(query));

describe("cabinet scheme URL contract", () => {
  it("starts with kitchen and wardrobe, while free combination starts empty", () => {
    expect(select().selection.modules).toEqual(["kitchen", "wardrobe"]);
    expect(select("p=whole-home").selection.modules).toEqual(["kitchen", "wardrobe", "tv", "shoe"]);
    expect(select("p=free").selection.modules).toEqual([]);
    expect(select("p=free").recovered).toBe(false);
  });
  it("keeps an explicitly cleared list empty through refresh", () => {
    const cleared = select("p=whole-home&m=").selection;
    expect(cleared.modules).toEqual([]);
    expect(select(cabinetSelectionParams(cleared).toString()).selection).toEqual(cleared);
    expect(cabinetQuotePath(cleared, "zh")).toBeNull();
  });
  it("keeps the entire scheme and campaign attribution through round trips", () => {
    const selection = select("p=free&s=walnut&c=dark-walnut&m=shoe,wardrobe,sideboard&r=bedroom").selection;
    const params = cabinetSelectionParams(selection, new URLSearchParams("utm_source=google&fc_test=1"));
    expect(select(params.toString()).selection).toEqual(selection);
    expect(params.get("utm_source")).toBe("google");
    expect(params.get("m")).toBe("wardrobe,shoe,sideboard");
  });
  it.each(["p=unknown", "o=unknown", "s=unknown", "c=unknown", "r=unknown", "m=kitchen,unknown", "m=kitchen,kitchen", "p=free&p=whole-home"])("recovers invalid options: %s", (query) => {
    const parsed = select(query);
    expect(parsed.recovered).toBe(true);
    expect(cabinetPalettes.find((palette) => palette.id === parsed.selection.paletteId)?.style).toBe(parsed.selection.styleId);
    expect(parsed.selection.modules.every((module) => cabinetModules.includes(module))).toBe(true);
  });
  it("does not silently accept a palette from another style", () => {
    expect(select("s=cream&c=dark-walnut")).toMatchObject({ recovered: true, selection: { styleId: "cream", paletteId: "cream-oak" } });
  });
  it("changes style without losing cabinet types, package or room", () => {
    const original = select("p=free&m=tv,shoe&r=living").selection;
    const changed = changeCabinetStyle(original, "walnut");
    expect(changed).toEqual({ ...original, styleId: "walnut", paletteId: "walnut-cream" });
  });
  it("keeps an existing compatible palette when the same style is selected", () => {
    const original = select("s=grey&c=grey-smoke").selection;
    expect(changeCabinetStyle(original, "grey")).toEqual(original);
  });
});

describe("existing quote handoff", () => {
  it.each(["zh", "en", "ms"] as const)("prefills the exact current %s scheme without new API fields", (language) => {
    const selection = select("p=free&s=walnut&c=dark-walnut&m=wardrobe,shoe&r=bedroom").selection;
    const path = cabinetQuotePath(selection, language)!;
    const url = new URL(path, "https://flashcast.com.my");
    expect(url.pathname).toBe("/quote");
    expect(url.hash).toBe("#quote-form");
    expect(url.searchParams.get("projectType")).toBe("Custom Built-In Furniture");
    expect(url.searchParams.get("source")).toBe("service");
    const details = url.searchParams.get("details")!;
    expect(details).toContain(text[language].palettes["dark-walnut"].name);
    expect(details).toContain(text[language].modules.wardrobe);
    expect(details).toContain(text[language].modules.shoe);
    expect(details).not.toContain(text[language].summary.countertop);
    expect(details).not.toContain(text[language].modules.kitchen);
    expect(details).not.toContain("dark-walnut");
    expect(path.length).toBeLessThan(6000);
  });
  it("adds the worktop reference only when a kitchen is requested", () => {
    const details = new URL(cabinetQuotePath(select().selection, "zh")!, "https://flashcast.com.my").searchParams.get("details");
    expect(details).toContain(text.zh.summary.countertop);
  });
});

describe("reviewed cabinet catalogue", () => {
  it("provides two compatible palettes for each of the four styles", () => {
    expect(cabinetStyleIds).toHaveLength(4);
    expect(cabinetPalettes).toHaveLength(8);
    for (const style of cabinetStyleIds) expect(cabinetPalettes.filter((palette) => palette.style === style)).toHaveLength(2);
  });
  it("ships 24 distinct WebP previews, with no missing or reused palette bitmap", () => {
    const hashes = new Set<string>();
    for (const palette of cabinetPalettes) for (const scene of cabinetScenes) {
      const file = resolve(process.cwd(), "public", cabinetPreviewPath(palette.id, scene).slice(1));
      expect(existsSync(file), file).toBe(true);
      const bytes = readFileSync(file);
      expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
      expect(bytes.length).toBeLessThan(350_000);
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
    }
    expect(hashes.size).toBe(24);
  });
  it("keeps every customer-visible translation path complete in three languages", () => {
    const leaves = (value: unknown, prefix = ""): string[] => typeof value === "string" ? [prefix] : Object.entries(value as object).flatMap(([key, nested]) => leaves(nested, `${prefix}.${key}`));
    const zhKeys = leaves(text.zh).sort();
    expect(leaves(text.en).sort()).toEqual(zhKeys);
    expect(leaves(text.ms).sort()).toEqual(zhKeys);
    expect(JSON.stringify(text.en)).not.toMatch(/[\u3400-\u9fff]/u);
    expect(JSON.stringify(text.ms)).not.toMatch(/[\u3400-\u9fff]/u);
  });
});

describe("package price and specification boundaries", () => {
  it.each(cabinetOffers)("restores $id including its exact priced scope", offer => {
    const selection = cabinetOfferSelection(offer);
    expect(matchingCabinetOffer(selection)).toEqual(offer);
    expect(parseCabinetSelection(cabinetSelectionParams(selection)).selection).toEqual(selection);
    expect(matchingCabinetOffer({ ...selection, scene: "bedroom" })).toEqual(offer);
    expect(matchingCabinetOffer({ ...selection, modules: selection.modules.slice(1) })).toBeUndefined();
    expect(matchingCabinetOffer({ ...selection, modules: [...selection.modules, "sideboard"] })).toBeUndefined();
    expect(matchingCabinetOffer(changeCabinetStyle(selection, offer.styleId === "cream" ? "grey" : "cream"))).toBeUndefined();
    const alternative = cabinetPalettes.find(palette => palette.style === offer.styleId && palette.id !== offer.paletteId)!;
    expect(matchingCabinetOffer({ ...selection, paletteId: alternative.id })).toBeUndefined();
  });
  it("does not substitute another package tier when style changes", () => {
    const original = cabinetOfferSelection(cabinetOffers[1]!);
    const changed = changeCabinetStyle(original, "grey");
    expect(changed.offerId).toBe(original.offerId);
    expect(matchingCabinetOffer(changed)).toBeUndefined();
    const restored = parseCabinetSelection(cabinetSelectionParams(changed)).selection;
    expect(restored.offerId).toBe(original.offerId);
    expect(matchingCabinetOffer(restored)).toBeUndefined();
  });
  it("exposes no unapproved amount or dimensions outside a loopback preview", () => {
    expect(cabinetOffers.every(offer => offer.status === "draft")).toBe(true);
    for (const host of ["flashcast.com.my", "preview.pages.dev", "localhost.evil.example", "192.168.1.8", ""]) {
      expect(canPreviewCabinetDrafts(host)).toBe(false);
      expect(visibleCabinetOffer(cabinetOffers[0]!, canPreviewCabinetDrafts(host))).toBeNull();
    }
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) expect(canPreviewCabinetDrafts(host)).toBe(true);
  });
  it.each(["zh", "en", "ms"] as const)("hands off a labelled %s draft, and removes the old price after customisation", language => {
    const offer = cabinetOffers[1]!;
    const selection = cabinetOfferSelection(offer);
    const detailsFor = (value: typeof selection, draft = false) => new URL(cabinetQuotePath(value, language, draft)!, "https://flashcast.com.my").searchParams.get("details")!;
    const draft = detailsFor(selection, true);
    expect(draft).toContain("RM 14,582.68");
    expect(draft).toContain(pricingText[language].draftCampaign);
    expect(draft).toContain(text[language].sales.specLabels.wardrobe);
    expect(draft).toContain("2400");
    expect(draft).toContain(text[language].sales.draftNote);
    expect(detailsFor(selection)).not.toContain("RM 14,582.68");
    expect(detailsFor({ ...selection, modules: [...selection.modules, "sideboard"] }, true)).not.toContain("RM 14,582.68");
  });
});
