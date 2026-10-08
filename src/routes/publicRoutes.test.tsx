import { act, Suspense } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publicRoutes } from "./publicRoutes";

vi.mock("@/components/LanguageRouteSync", () => ({ LanguageRouteSync: () => null, LegacyLanguageRedirect: () => null, ProductsToMaterialsRedirect: () => null, RootLanguageRedirect: () => null }));
vi.mock("@/pages/ServiceDetail", () => ({ default: () => null }));
vi.mock("@/pages/OldHouseRenovation", () => ({ default: () => null }));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
function LocationProbe() { const location = useLocation(); return <output>{location.pathname}{location.search}{location.hash}</output>; }
const slugs = [
  ["office-renovation", "office-renovation"], ["shop-renovation", "shop-renovation"], ["bathroom-renovation", "bathroom"],
  ["old-house-renovation", "old-house"], ["custom-built-in", "builtin"], ["warehouse-shelving", "warehouse"],
  ["kitchen-cabinet", "kitchen"], ["flooring", "flooring"],
];
describe("migrated landing URLs", () => {
  for (const language of ["zh", "en"]) {
    it.each(slugs)(`${language}: preserves campaign parameters and fragment from %s to %s`, async (landing, service) => {
      await act(async () => root.render(<MemoryRouter initialEntries={[`/${language}/landing/${landing}?utm_source=fixture&utm_campaign=renovation#main-content`]}><LocationProbe /><Suspense fallback={null}><Routes>{publicRoutes}</Routes></Suspense></MemoryRouter>));
      await vi.waitFor(async () => {
        await act(async () => { await Promise.resolve(); });
        expect(container.querySelector("output")?.textContent).toBe(`/${language}/services/${service}?utm_source=fixture&utm_campaign=renovation#main-content`);
      });
    });
  }
});
