import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicResultsBoundary from "./PublicResultsBoundary";
import PublicReadError from "./PublicReadError";

vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
let root: Root;
let container: HTMLDivElement;
const retry = vi.fn();
const settled = { isLoading: false, isFetching: false, isInitialError: false, refetch: retry };
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); retry.mockReset(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe("shared public results states", () => {
  it("distinguishes initial failure from an empty result and retries", () => {
    act(() => root.render(<PublicResultsBoundary query={{ ...settled, isInitialError: true }} summary={<p>0 matching items</p>} isEmpty empty="Empty results"><p>Old result</p></PublicResultsBoundary>));
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("内容加载失败");
    expect(container.textContent).not.toContain("Empty results");
    expect(container.textContent).not.toContain("0 matching items");
    act(() => container.querySelector<HTMLButtonElement>("button")!.click()); expect(retry).toHaveBeenCalledOnce();
    act(() => root.render(<PublicResultsBoundary query={settled} summary={<p>0 matching items</p>} isEmpty empty="Empty results"><p>Old result</p></PublicResultsBoundary>));
    expect(container.querySelector('[role="status"]')).toHaveTextContent("Empty results");
    expect(container.textContent).toContain("0 matching items");
  });
  it("marks background updates busy while preserving result DOM and focus", () => {
    const content = <a href="/zh/projects/example">Confirmed result</a>;
    act(() => root.render(<PublicResultsBoundary query={settled}>{content}</PublicResultsBoundary>));
    const link = container.querySelector<HTMLAnchorElement>("a")!; link.focus();
    act(() => root.render(<PublicResultsBoundary query={{ ...settled, isFetching: true }}>{content}</PublicResultsBoundary>));
    expect(container.querySelector('[data-public-results]')).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("a")).toBe(link); expect(document.activeElement).toBe(link);
    expect(container.textContent).toBe("Confirmed result");
  });
  it("shows a busy initial state without results and retains explicitly approved fallback content", () => {
    const query = { ...settled, isLoading: true, isFetching: true };
    act(() => root.render(<PublicResultsBoundary query={query}><p>Fallback content</p></PublicResultsBoundary>));
    expect(container.querySelector('[data-content-state="loading"]')).toHaveAttribute("aria-busy", "true");
    expect(container.textContent).not.toContain("Fallback content");
    act(() => root.render(<PublicResultsBoundary query={query} keepFallback><p>Fallback content</p></PublicResultsBoundary>));
    expect(container.textContent).toContain("Fallback content");
  });
  it("renders a valid error heading and accessible retry action", () => {
    act(() => root.render(<PublicReadError onRetry={retry} />));
    expect(container.querySelector('[role="alert"] h1')).toHaveTextContent("内容加载失败");
    expect(container.querySelector("p h1")).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>("button")!.click()); expect(retry).toHaveBeenCalledOnce();
  });
});
