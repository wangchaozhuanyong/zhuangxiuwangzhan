import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLeadList from "./AdminLeadList";
import AdminQuoteList from "./AdminQuoteList";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

const { leads, quotes } = vi.hoisted(() => ({ leads: vi.fn(), quotes: vi.fn() }));
vi.mock("@/lib/adminLeadQueries", () => ({ useAdminLeads: leads, useAdminQuotes: quotes }));
vi.mock("@/lib/adminLocale", () => ({ getAdminLang: () => "zh" }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const result = { data: { rows: [{ id: "sample", name: "Sample", customer_name: "Sample", phone: "+60123456789", customer_phone: "+60123456789", created_at: "2026-10-05T00:00:00Z" }], count: 1, pageSize: 30 }, isFetching: false, isPlaceholderData: false };
  leads.mockReset().mockReturnValue(result);
  quotes.mockReset().mockReturnValue(result);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe.each([
  { path: "/admin/leads", Component: AdminLeadList, query: leads, status: "new" },
  { path: "/admin/quotes", Component: AdminQuoteList, query: quotes, status: "pending" },
])("mobile CRM filters: $path", ({ path, Component, query, status }) => {
  it("keeps the selected queue visible, preserves mutually exclusive filters, and clears search as well as URL filters", async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={[`${path}?filter=due_followups`]}><Component /></MemoryRouter>));
    const [statusSelect, queueSelect] = Array.from(container.querySelectorAll("select"));
    expect(queueSelect.value).toBe("due_followups");
    expect(statusSelect.value).toBe("all");
    expect(container.querySelector('[role="status"]')).toHaveTextContent(queueSelect.selectedOptions[0].textContent!);
    expect(container.querySelector('a[href^="tel:"]')).not.toBeNull();
    expect(container.querySelector('a[href^="https://wa.me/"]')).not.toBeNull();

    await act(async () => {
      statusSelect.value = status;
      statusSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(queueSelect.value).toBe("all");
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ status, workflow: "all", page: 0 }));

    const search = container.querySelector("input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(search, "sample query");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(search.value).toBe("sample query");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, INTERACTION_POLICY.searchDelay + 20)); });
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ search: "sample query" }));
    const clear = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "清除筛选")!;
    await act(async () => clear.click());
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, INTERACTION_POLICY.searchDelay + 20)); });
    expect(search.value).toBe("");
    expect(statusSelect.value).toBe("all");
    expect(queueSelect.value).toBe("all");
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ search: "", status: "all", workflow: "all", page: 0 }));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
