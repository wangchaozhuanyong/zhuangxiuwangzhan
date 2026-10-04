import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteReadFeedback from "./RouteReadFeedback";

vi.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: "/admin/furniture" }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/lib/adminPreferences", () => ({ useAdminLang: () => "zh" }));

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
const read = vi.fn<() => Promise<string>>();

function Reader({ prefix, initialData }: { prefix: string; initialData?: string }) {
  const { data } = useQuery({ queryKey: [prefix, "feedback-regression"], queryFn: read, initialData, staleTime: 0 });
  return <p>{data}</p>;
}

async function renderReader({ show = true, prefix = "admin", initialData }: { show?: boolean; prefix?: string; initialData?: string } = {}) {
  await act(async () => {
    root.render(<QueryClientProvider client={client}>
      <RouteReadFeedback surface="admin" />
      {show && <Reader prefix={prefix} initialData={initialData} />}
    </QueryClientProvider>);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  read.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("route read feedback cache subscription", () => {
  it("does not update feedback during another component's query initialization", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    read.mockResolvedValue("Loaded furniture");
    await renderReader({ show: false });
    await renderReader();
    await settle();
    expect(container.textContent).toContain("Loaded furniture");
    expect(errors.mock.calls.map((args) => args.join(" ")).join("\n")).not.toMatch(/Cannot update a component.*while rendering a different component/);
  });

  it("shows an initial error and recovers through the existing retry button", async () => {
    read.mockRejectedValue(new Error("Synthetic failed read"));
    await renderReader();
    await settle();
    expect(container.textContent).toContain("内容加载失败，请重试。");
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("重试");
    read.mockResolvedValue("Recovered furniture");
    await act(async () => button.click());
    await settle();
    expect(container.textContent).toContain("Recovered furniture");
    expect(container.querySelector("aside")).toBeNull();
  });

  it("keeps successful content and distinguishes a refresh failure", async () => {
    read.mockRejectedValue(new Error("Synthetic refresh failure"));
    await renderReader({ initialData: "Previous furniture" });
    await settle();
    expect(container.textContent).toContain("Previous furniture");
    expect(container.textContent).toContain("更新未完成，已保留上次取得的内容。");
    expect(container.textContent).not.toContain("内容加载失败，请重试。");
    await renderReader({ show: false });
    await settle();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("ignores public query failures on the admin surface", async () => {
    read.mockRejectedValue(new Error("Synthetic public failure"));
    await renderReader({ prefix: "published" });
    await settle();
    expect(container.querySelector("aside")).toBeNull();
  });
});
