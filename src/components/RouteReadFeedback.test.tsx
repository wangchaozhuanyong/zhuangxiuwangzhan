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

async function renderReader({ show = true, surface = "admin", prefix = surface === "admin" ? "admin" : "published", initialData }: {
  show?: boolean; surface?: "admin" | "public"; prefix?: string; initialData?: string;
} = {}) {
  await act(async () => {
    root.render(<QueryClientProvider client={client}>
      <RouteReadFeedback surface={surface} />
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
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("route read feedback cache subscription", () => {
  it.each([
    ["published", undefined], ["published", "Previous content"],
    ["site-settings", undefined], ["site-settings", "Confirmed settings"],
  ] as const)("keeps public %s reads quiet with initial data %s, including slow background requests", async (prefix, initialData) => {
    vi.useFakeTimers();
    let resolve!: (value: string) => void;
    read.mockImplementation(() => new Promise<string>((done) => { resolve = done; }));
    await act(async () => root.render(<QueryClientProvider client={client}>
      <RouteReadFeedback surface="public" />
      <Reader prefix={prefix} initialData={initialData} />
    </QueryClientProvider>));
    await act(async () => vi.advanceTimersByTimeAsync(250));
    expect(client.isFetching()).toBe(1);
    expect(container.querySelector("aside")).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(container.querySelector("aside")).toBeNull();
    if (initialData) expect(container.textContent).toContain(initialData);
    await act(async () => { resolve("Updated content"); });
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(container.textContent).toContain("Updated content");
    expect(client.isFetching()).toBe(0);
    expect(container.querySelector("aside")).toBeNull();
  });

  it("keeps admin delayed progress and slow recovery, then clears them after success", async () => {
    vi.useFakeTimers();
    let resolve!: (value: string) => void;
    read.mockImplementation(() => new Promise<string>((done) => { resolve = done; }));
    await act(async () => root.render(<QueryClientProvider client={client}>
      <RouteReadFeedback surface="admin" />
      <Reader prefix="admin" initialData="Previous content" />
    </QueryClientProvider>));
    expect(container.querySelector("aside")).toBeNull();
    // First flush the query-cache notification, then the feedback delay it starts.
    await act(async () => vi.advanceTimersByTimeAsync(250));
    await act(async () => vi.advanceTimersByTimeAsync(250));
    expect(container.textContent).toContain("正在更新");
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(container.textContent).toContain("加载需要较长时间，可以重试。");
    expect(container.querySelector<HTMLButtonElement>("button")!.disabled).toBe(true);
    await act(async () => { resolve("Updated content"); });
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(container.textContent).toContain("Updated content");
    expect(container.querySelector("aside")).toBeNull();
  });

  it("keeps public offline feedback and clears it when the connection returns", async () => {
    const connection = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    read.mockResolvedValue("Previous content");
    await renderReader({ surface: "public", initialData: "Previous content" });
    expect(container.textContent).toContain("网络已断开，已有内容仍可查看。");
    connection.mockReturnValue(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    await settle();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("does not update feedback during another component's query initialization", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    read.mockResolvedValue("Loaded furniture");
    await renderReader({ show: false });
    await renderReader();
    await settle();
    expect(container.textContent).toContain("Loaded furniture");
    expect(errors.mock.calls.map((args) => args.join(" ")).join("\n")).not.toMatch(/Cannot update a component.*while rendering a different component/);
  });

  it.each(["admin", "public"] as const)("shows an initial error and recovers through the existing retry button on %s", async (surface) => {
    read.mockRejectedValue(new Error("Synthetic failed read"));
    await renderReader({ surface });
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

  it.each(["admin", "public"] as const)("keeps successful content and distinguishes a refresh failure on %s", async (surface) => {
    read.mockRejectedValue(new Error("Synthetic refresh failure"));
    await renderReader({ surface, initialData: "Previous furniture" });
    await settle();
    expect(container.textContent).toContain("Previous furniture");
    expect(container.textContent).toContain("更新未完成，已保留上次取得的内容。");
    expect(container.textContent).not.toContain("内容加载失败，请重试。");
    await renderReader({ show: false, surface });
    await settle();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("ignores public query failures on the admin surface", async () => {
    read.mockRejectedValue(new Error("Synthetic public failure"));
    await renderReader({ prefix: "published" });
    await settle();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("includes shared site settings failures in the retry lifecycle", async () => {
    read.mockRejectedValue(new Error("Settings refresh failed"));
    await renderReader({ prefix: "site-settings", initialData: "Confirmed settings" });
    await settle();
    expect(container.textContent).toContain("Confirmed settings");
    expect(container.textContent).toContain("更新未完成，已保留上次取得的内容。");
    read.mockResolvedValue("Fresh settings");
    await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
    await settle();
    expect(container.textContent).toContain("Fresh settings");
    expect(container.querySelector("aside")).toBeNull();
  });
});
