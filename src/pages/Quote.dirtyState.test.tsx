import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { hasProtectedChanges } from "@/lib/navigationProtection";
import { interactionText } from "@/i18n/interactionText";
import { quotePageText } from "@/i18n/quotePageText";
import Quote from "./Quote";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", submit: vi.fn() }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedSitePage: () => ({ data: undefined, isLoading: false }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  short_address: "Fixture office", phone_display: "Fixture phone", phone_href: "tel:+601100000000",
  whatsapp_url: () => "https://wa.me/601100000000",
}) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 123 }) }));
vi.mock("@/hooks/use-scroll-reveal", () => ({ useScrollReveal: () => ({ ref: { current: null }, isVisible: true }) }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));
vi.mock("@/lib/analytics", () => ({ trackCtaClick: vi.fn(), trackQuoteFormSubmit: vi.fn() }));
vi.mock("@/lib/leadApi", () => ({ submitQuoteRequest: state.submit }));

const kitchenPath = "/en/quote?source=service&title=Kitchen+Renovation+in+Kuala+Lumpur+%26+Selangor&projectType=Kitchen+Cabinet#quote-form";
let container: HTMLDivElement;
let root: Root;
let navigate: NavigateFunction;
function RouteControl() { navigate = useNavigate(); return null; }
const page = (path: string) => (
  <HelmetProvider><PublicChromeProvider isAdminRoute={false} routeKey="/quote">
    <MemoryRouter initialEntries={[path]}><RouteControl /><Quote /></MemoryRouter>
  </PublicChromeProvider></HelmetProvider>
);

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.language = "en";
  state.submit.mockReset();
  state.submit.mockImplementation(() => { throw new Error("Unexpected fixture submission"); });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove();
  expect(hasProtectedChanges()).toBe(false);
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function render(path = kitchenPath) {
  window.history.replaceState({}, "", path);
  await act(async () => root.render(page(path)));
}
async function changeContext(path: string, language = state.language) {
  state.language = language;
  window.history.replaceState({}, "", path);
  await act(async () => { navigate(path); root.render(page(path)); });
}
const field = (name: string) => container.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#quote-${name}`)!;
async function input(name: string, value: string) {
  await act(async () => {
    const element = field(name);
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}
const send = async () => {
  await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
};
function protectsUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
function expectProtected(value: boolean) { expect(hasProtectedChanges()).toBe(value); expect(protectsUnload()).toBe(value); }
async function fill() {
  await input("name", "Synthetic fixture"); await input("phone", "+60112345678"); await input("location", "Fixture KL");
}
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("quotation initial, contextual and submitted draft baselines", () => {
  it.each(["en", "zh"] as const)("focuses the form from the %s hero without discarding a draft", async (language) => {
    state.language = language;
    await render(`/${language}/quote`);
    await input("name", "Synthetic fixture");
    const start = container.querySelector<HTMLAnchorElement>('a[href="#quote-form"]')!;
    expect(start.textContent).toBe(quotePageText[language].startForm);
    expect(start.getAttribute("aria-controls")).toBe("quote-form");
    await act(async () => start.click());
    await vi.waitFor(() => expect(document.activeElement).toBe(container.querySelector("#quote-form-title")));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start", inline: "nearest" });
    expect(field("name").value).toBe("Synthetic fixture");
    expectProtected(true);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("keeps the kitchen prefill clean through focus and blur without claiming a save", async () => {
    await render();
    expect(field("project-type").value).toBe("Kitchen Cabinet");
    expect(field("details").value).toBe("I would like to ask about: Kitchen Renovation in Kuala Lumpur & Selangor.");
    expect(container.textContent).toContain("Prepared from service: Kitchen Renovation in Kuala Lumpur & Selangor");
    await act(async () => { field("name").focus(); field("name").blur(); });
    expectProtected(false);
    expect(container.textContent).not.toContain(interactionText.en.savedWhileEditing);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("keeps direct empty entry clean and releases protection when a real edit is restored", async () => {
    await render("/en/quote"); expectProtected(false);
    await input("name", "Synthetic fixture"); expectProtected(true);
    await input("name", ""); expectProtected(false);
    await input("project-type", "Kitchen Cabinet"); expectProtected(true);
    await input("project-type", ""); expectProtected(false);
  });

  it.each([
    ["name", "Synthetic fixture"], ["phone", "+60112345678"], ["email", "fixture@example.invalid"],
    ["project-type", "Office Renovation"], ["location", "Fixture KL"], ["budget", "Not sure yet"],
    ["property-size", "900"], ["details", "Handwritten fixture requirement"],
  ])("protects an actual %s change and releases it only when the baseline is restored", async (name, value) => {
    await render();
    const initial = field(name).value;
    await input(name, value); expectProtected(true);
    await input(name, initial); expectProtected(false);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("restores automatic context updates when an edit is returned to its clean prefill", async () => {
    await render();
    await input("project-type", "Office Renovation"); expectProtected(true);
    await input("project-type", "Kitchen Cabinet"); expectProtected(false);
    await changeContext("/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation#quote-form");
    expect(field("project-type").value).toBe("Bathroom Renovation"); expectProtected(false);
  });

  it("protects clearing every automatic prefill even when every field becomes empty", async () => {
    await render();
    await input("project-type", ""); await input("details", "");
    expect(Array.from(container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("form input:not([name=website]),form select,form textarea"), element => element.value).every(value => value === "")).toBe(true);
    expectProtected(true);
    await input("project-type", "Kitchen Cabinet");
    await input("details", "I would like to ask about: Kitchen Renovation in Kuala Lumpur & Selangor.");
    expectProtected(false);
  });

  it("updates only automatic context fields and their baselines while preserving an unrelated edit", async () => {
    await render(); await input("name", "Synthetic fixture");
    await changeContext("/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation&location=Fixture+PJ#quote-form");
    expect(field("name").value).toBe("Synthetic fixture");
    expect(field("project-type").value).toBe("Bathroom Renovation");
    expect(field("location").value).toBe("Fixture PJ");
    expect(field("details").value).toBe("I would like to ask about: Bathroom fixture.");
    expectProtected(true);
    await input("name", ""); expectProtected(false);
    expect(container.textContent).not.toContain(interactionText.en.savedWhileEditing);
  });

  it("preserves edited and cleared context fields when new context arrives", async () => {
    await render();
    await input("project-type", "Office Renovation"); await input("location", "Fixture location"); await input("details", "");
    await changeContext("/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation&location=Fixture+PJ#quote-form");
    expect(field("project-type").value).toBe("Office Renovation");
    expect(field("location").value).toBe("Fixture location");
    expect(field("details").value).toBe(""); expectProtected(true);
  });

  it("localizes an untouched automatic description without losing a contact edit or focus", async () => {
    await render(); await input("name", "Synthetic fixture");
    const name = field("name"); name.focus();
    await changeContext(kitchenPath.replace("/en/", "/zh/"), "zh");
    expect(field("name")).toBe(name); expect(document.activeElement).toBe(name);
    expect(field("name").value).toBe("Synthetic fixture");
    expect(field("details").value).toBe("我想咨询：Kitchen Renovation in Kuala Lumpur & Selangor。");
    expectProtected(true);
    await input("name", ""); expectProtected(false);
    await changeContext(kitchenPath, "en"); expectProtected(false);
  });

  it("keeps a handwritten description during language changes", async () => {
    await render(); await input("details", "Handwritten fixture requirement");
    await changeContext(kitchenPath.replace("/en/", "/zh/"), "zh");
    expect(field("details").value).toBe("Handwritten fixture requirement"); expectProtected(true);
  });

  it("does not acknowledge a handwritten location when later context matches it", async () => {
    await render(); await input("location", "Fixture PJ");
    const nextPath = "/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation&location=Fixture+PJ#quote-form";
    await changeContext(nextPath); expectProtected(true);
    await changeContext(nextPath.replace("/en/", "/zh/"), "zh");
    expect(field("location").value).toBe("Fixture PJ"); expectProtected(true);
    await input("location", ""); expectProtected(false);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it.each([
    ["location", "Fixture PJ", "location=Fixture+PJ", "location=Fixture+KL"],
    ["project-type", "Office Renovation", "projectType=Office+Renovation", "projectType=Bathroom+Renovation"],
    ["details", "Handwritten fixture requirement", "details=Handwritten+fixture+requirement", "details=Other+fixture+requirement"],
  ])("preserves a handwritten %s across matching and subsequent contexts", async (name, value, matching, next) => {
    await render(); await input(name, value);
    await changeContext(`/en/quote?${matching}#quote-form`);
    expect(field(name).value).toBe(value); expectProtected(true);
    await changeContext(`/en/quote?${next}#quote-form`);
    expect(field(name).value).toBe(value); expectProtected(true);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("protects a pending submission even after inputs return to the initial baseline", async () => {
    const pending = deferred(); state.submit.mockReturnValue(pending.promise);
    await render(); await fill(); await send(); await send();
    expect(state.submit).toHaveBeenCalledTimes(1);
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    await input("name", ""); await input("phone", ""); await input("location", "");
    expectProtected(true);
    await act(async () => pending.reject(new Error("Fixture failure")));
    expect(field("name").value).toBe("");
    expect(container.textContent).toContain(quotePageText.en.errorTitle);
    expectProtected(false);
  });

  it("retains failed input and protection, then acknowledges only a successful retry", async () => {
    state.submit.mockRejectedValueOnce(new Error("Fixture failure"));
    await render(); await fill(); await send();
    expect(field("name").value).toBe("Synthetic fixture");
    expect(container.textContent).toContain(quotePageText.en.errorTitle); expectProtected(true);
    state.submit.mockResolvedValue(undefined); await send();
    expect(state.submit).toHaveBeenCalledTimes(2);
    expect(container.querySelector("form")).toBeNull();
    expect(container.textContent).toContain(quotePageText.en.successTitle); expectProtected(false);
  });

  it("confirms the submitted snapshot without confirming a later input, and locks duplicate requests", async () => {
    const pending = deferred(); state.submit.mockReturnValue(pending.promise);
    await render(); await fill(); await send(); await send();
    expect(state.submit).toHaveBeenCalledTimes(1);
    expect(state.submit.mock.calls[0][0].location).toBe("Fixture KL");
    expectProtected(true);
    await input("location", "Fixture PJ");
    await act(async () => pending.resolve());
    expect(field("location").value).toBe("Fixture PJ");
    expect(container.textContent).toContain(interactionText.en.savedWhileEditing); expectProtected(true);
    await input("location", "Fixture KL"); expectProtected(false);
  });

  it("keeps an edit made in the same batch as the successful acknowledgement", async () => {
    const pending = deferred(); state.submit.mockReturnValue(pending.promise);
    await render(); await fill(); await send();
    const location = field("location");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(location, "Later fixture edit");
      location.dispatchEvent(new Event("input", { bubbles: true }));
      pending.resolve();
    });
    expect(container.querySelector("form")).not.toBeNull();
    expect(field("location").value).toBe("Later fixture edit"); expectProtected(true);
  });

  it("does not confirm an automatic context change occurring after the submission snapshot", async () => {
    const pending = deferred(); state.submit.mockReturnValue(pending.promise);
    await render(); await fill(); await send();
    await changeContext("/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation#quote-form");
    await act(async () => pending.resolve());
    expect(field("project-type").value).toBe("Bathroom Renovation");
    expect(state.submit.mock.calls[0][0].projectType).toBe("Kitchen Cabinet");
    expectProtected(true);
    state.submit.mockResolvedValue(undefined); await send();
    expect(container.querySelector("form")).toBeNull(); expectProtected(false);
  });

  it("keeps unsubmitted context protected through language changes after an earlier request succeeds", async () => {
    const pending = deferred(); state.submit.mockReturnValue(pending.promise);
    await render(); await fill(); await send();
    const nextPath = "/en/quote?source=service&title=Bathroom+fixture&projectType=Bathroom+Renovation#quote-form";
    await changeContext(nextPath);
    await act(async () => pending.resolve()); expectProtected(true);
    await changeContext(nextPath.replace("/en/", "/zh/"), "zh");
    expect(field("project-type").value).toBe("Bathroom Renovation");
    expect(field("details").value).toBe("我想咨询：Bathroom fixture。"); expectProtected(true);
    await changeContext(nextPath, "en"); expectProtected(true);
    expect(state.submit).toHaveBeenCalledTimes(1);
    state.submit.mockResolvedValue(undefined); await send();
    expect(container.querySelector("form")).toBeNull(); expectProtected(false);
  });
});
