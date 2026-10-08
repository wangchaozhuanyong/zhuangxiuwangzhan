import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingQuoteForm from "./LandingQuoteForm";
import { landingPageText } from "@/i18n/landingPageText";
import { interactionText } from "@/i18n/interactionText";
import { hasProtectedChanges } from "@/lib/navigationProtection";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", submit: vi.fn() }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 123 }) }));
vi.mock("@/lib/leadApi", () => ({ submitQuoteRequest: state.submit }));
vi.mock("@/lib/analytics", () => ({ trackQuoteFormSubmit: vi.fn() }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.language = "en";
  state.submit.mockReset();
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(<LandingQuoteForm landingTitle="Campaign fixture" />)); };
const field = (name: string) => container.querySelector<HTMLInputElement | HTMLSelectElement>(`#landing-quote-${name}`)!;
async function input(name: string, value: string) {
  await act(async () => {
    const element = field(name);
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}
const send = async () => { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); };
async function fill() {
  await input("name", "Test fixture"); await input("phone", "+60112345678");
  await input("project-type", "Residential Renovation"); await input("location", "KL");
}

describe("landing quotation draft protection", () => {
  it("localizes existing validation errors without replacing focused fields or input", async () => {
    await render(); await input("phone", "invalid"); await send();
    const phone = field("phone"); phone.focus();
    expect(container.textContent).toContain(landingPageText.en.formPhoneInvalid);
    state.language = "zh"; await render();
    expect(field("phone")).toBe(phone); expect(document.activeElement).toBe(phone);
    expect(phone.value).toBe("invalid");
    expect(container.textContent).toContain(landingPageText.zh.formPhoneInvalid);
    expect(container.textContent).not.toContain(landingPageText.en.formRequired);
    state.language = "en"; await render();
    expect(container.textContent).toContain(landingPageText.en.formRequired);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("locks duplicate requests and confirms only the snapshot when new edits arrive", async () => {
    let resolve!: () => void;
    state.submit.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    await render(); await fill(); await send(); await send();
    expect(state.submit).toHaveBeenCalledTimes(1);
    expect(state.submit.mock.calls[0][0].location).toBe("KL");
    await input("location", "PJ");
    const original = field("location");
    await act(async () => resolve());
    expect(field("location")).toBe(original); expect(original.value).toBe("PJ");
    expect(container.textContent).toContain(interactionText.en.savedWhileEditing);
    expect(container.querySelector("form")).not.toBeNull();
    expect(hasProtectedChanges()).toBe(true);
    state.submit.mockResolvedValue(undefined); await send();
    expect(state.submit).toHaveBeenCalledTimes(2);
    expect(state.submit.mock.calls[1][0].location).toBe("PJ");
    expect(container.textContent).toContain(landingPageText.en.formSuccessTitle);
    expect(hasProtectedChanges()).toBe(false);
  });

  it("preserves a failed draft and allows a successful retry", async () => {
    state.submit.mockRejectedValueOnce(new Error("Fixture unavailable"));
    await render(); await fill(); await send();
    expect(field("name").value).toBe("Test fixture");
    expect(container.textContent).toContain(landingPageText.en.formError);
    expect(hasProtectedChanges()).toBe(true);
    state.submit.mockResolvedValue(undefined); await send();
    expect(container.querySelector("form")).toBeNull();
    expect(hasProtectedChanges()).toBe(false);
  });
  it("keeps an edit arriving in the same batch as the previous acknowledgement", async () => {
    let resolve!: () => void;
    state.submit.mockReturnValue(new Promise<void>(done => { resolve = done; }));
    await render(); await fill(); await send();
    const location = field("location");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(location, "New edit before render");
      location.dispatchEvent(new Event("input", { bubbles: true }));
      resolve();
    });
    expect(field("location")).toBe(location); expect(location.value).toBe("New edit before render");
    expect(container.textContent).toContain(interactionText.en.savedWhileEditing);
    expect(hasProtectedChanges()).toBe(true);
  });
});
