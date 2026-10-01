import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { appErrorBoundaryText } from "@/i18n/appErrorBoundaryText";
import { logSystemEvent } from "@/lib/systemLog";

vi.mock("@/lib/systemLog", () => ({ logSystemEvent: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
const MissingRoute = (): never => {
  throw new TypeError("Failed to fetch dynamically imported module: /assets/ServiceDetail-missing.js");
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  window.sessionStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("explicit route-load recovery", () => {
  it.each(["zh", "en"] as const)("keeps the %s error page actionable and logs without scheduling a second navigation", async (language) => {
    window.history.replaceState(null, "", `/${language}/services/design`);
    const url = window.location.href;
    await act(async () => root.render(<AppErrorBoundary><MissingRoute /></AppErrorBoundary>));
    const copy = appErrorBoundaryText[language];
    expect(container.querySelector("h1")?.textContent).toBe(copy.chunkTitle);
    expect(container.querySelector("button")?.textContent).toBe(copy.refresh);
    expect(container.textContent).toContain(copy.chunkBody);
    expect(window.location.href).toBe(url);
    expect(window.sessionStorage.getItem("flashcast:chunk-load-recovery")).toBeNull();
    expect(logSystemEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "frontend_deploy_cache_mismatch",
      severity: "error",
      source: "frontend",
      metadata: expect.objectContaining({ path: `/${language}/services/design`, isChunkLoadError: true }),
    }));
  });
});
