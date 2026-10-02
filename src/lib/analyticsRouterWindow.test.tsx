import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter, Link, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnalyticsRouterWindow } from "./analyticsRouterWindow";

let root: Root | undefined;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/en/services");
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(async () => {
  if (root) await act(() => root?.unmount());
  root = undefined;
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("analytics document boundary", () => {
  it.each(["/admin", "/admin/", "/admin/login?next=dashboard#login", "/admin/publish-center"])(
    "navigates to %s before changing public history", (path) => {
      const navigate = vi.fn();
      const push = vi.spyOn(window.history, "pushState");
      const adapter = createAnalyticsRouterWindow(window, navigate);
      adapter.history.pushState({ idx: 1 }, "", path);
      expect(navigate).toHaveBeenCalledExactlyOnceWith(new URL(path, window.location.origin).href, false);
      expect(push).not.toHaveBeenCalled();
      expect(window.location.pathname).toBe("/en/services");
    },
  );

  it("preserves replace navigation and crosses back to a fresh public document", () => {
    window.history.replaceState(null, "", "/admin/login");
    const navigate = vi.fn();
    const replace = vi.spyOn(window.history, "replaceState");
    const adapter = createAnalyticsRouterWindow(window, navigate);
    adapter.history.replaceState({ private: "not transferred" }, "", "/zh/contact?source=site#form");
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      new URL("/zh/contact?source=site#form", window.location.origin).href, true,
    );
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/admin/login");
  });

  it("keeps public history wrappers, query/hash/state and native method receivers", () => {
    const navigate = vi.fn();
    const adapter = createAnalyticsRouterWindow(window, navigate);
    // A tag can install its wrapper after the adapter is constructed.
    const push = vi.spyOn(window.history, "pushState");
    adapter.history.pushState({ idx: 1, usr: "public state" }, "", "/zh/quote?service=kitchen#form");
    expect(push).toHaveBeenCalledOnce();
    expect(adapter.history.state).toEqual({ idx: 1, usr: "public state" });
    expect(adapter.location.href).toContain("/zh/quote?service=kitchen#form");
    adapter.history.replaceState({ idx: 1 }, "");
    expect(navigate).not.toHaveBeenCalled();
    const listener = vi.fn();
    adapter.addEventListener("boundary-test", listener);
    window.dispatchEvent(new Event("boundary-test"));
    adapter.removeEventListener("boundary-test", listener);
    window.dispatchEvent(new Event("boundary-test"));
    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps admin-internal history and does not turn invalid/cross-origin URLs into boundary redirects", () => {
    window.history.replaceState(null, "", "/admin");
    const navigate = vi.fn();
    const adapter = createAnalyticsRouterWindow(window, navigate);
    adapter.history.pushState({ idx: 1 }, "", "/admin/dashboard");
    expect(window.location.pathname).toBe("/admin/dashboard");
    expect(() => adapter.history.pushState(null, "", "https://example.org/en")).toThrow();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not change existing consent or opt-out flags", () => {
    const flags = window as Window & { "ga-disable-G-LLJGRG2YNP"?: boolean };
    flags["ga-disable-G-LLJGRG2YNP"] = true;
    const navigate = vi.fn();
    createAnalyticsRouterWindow(window, navigate).history.pushState(null, "", "/admin");
    expect(flags["ga-disable-G-LLJGRG2YNP"]).toBe(true);
    delete flags["ga-disable-G-LLJGRG2YNP"];
  });
});

const RouteProbe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <output data-testid="path">{location.pathname}{location.search}</output>
    <Link to="/zh/contact?source=nav">public</Link>
    <Link to="/admin">admin</Link>
    <button onClick={() => navigate("/en/quote?source=admin", { replace: true })}>return</button>
    <button onClick={() => navigate(-1)}>back</button>
  </>;
};

const click = async (label: string) => {
  const element = Array.from(container.querySelectorAll("a,button")).find((node) => node.textContent === label)!;
  await act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
};

describe("React Router uses the document boundary", () => {
  it("keeps public Link/back as SPA and never renders admin while document navigation is pending", async () => {
    const navigate = vi.fn();
    root = createRoot(container);
    await act(() => root!.render(<BrowserRouter window={createAnalyticsRouterWindow(window, navigate)}
      ><RouteProbe /></BrowserRouter>));
    await click("public");
    expect(container.querySelector("output")?.textContent).toBe("/zh/contact?source=nav");
    await click("admin");
    expect(navigate).toHaveBeenCalledExactlyOnceWith(new URL("/admin", window.location.origin).href, false);
    expect(container.querySelector("output")?.textContent).toBe("/zh/contact?source=nav");
    expect(window.location.pathname).toBe("/zh/contact");
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(container.querySelector("output")?.textContent).toBe("/en/services");
  });

  it("keeps admin rendered until the replace navigation to public commits a new document", async () => {
    window.history.replaceState(null, "", "/admin");
    const navigate = vi.fn();
    root = createRoot(container);
    await act(() => root!.render(<BrowserRouter window={createAnalyticsRouterWindow(window, navigate)}
      ><RouteProbe /></BrowserRouter>));
    await click("return");
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      new URL("/en/quote?source=admin", window.location.origin).href, true,
    );
    expect(container.querySelector("output")?.textContent).toBe("/admin");
  });
});
