import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminContentPreflight from "./AdminContentPreflight";
import { setAdminLang } from "@/lib/adminPreferences";
import { AdminContentPreflightError, type AdminContentPreflightResult } from "@/lib/adminMutation";

const revision = "2026-10-05T04:03:12.123456+00:00";
const record = { id: "row-1", updated_at: revision, version: 7, content_zh: "原正文" };
const result: AdminContentPreflightResult = { recordId: "row-1", expectedUpdatedAt: revision, fieldCount: 2, warningCount: 1 };
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  setAdminLang("zh");
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); setAdminLang("zh"); vi.unstubAllGlobals(); });
const button = () => container.querySelector("button")!;

describe("content preflight panel", () => {
  it("shows the exact loaded revision and prevents repeated clicks while pending", async () => {
    let resolve!: (value: AdminContentPreflightResult) => void;
    const onPreview = vi.fn(() => new Promise<AdminContentPreflightResult>((done) => { resolve = done; }));
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={onPreview} />));
    expect(container.textContent).toContain(revision);
    await act(async () => { button().click(); button().click(); });
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(button().disabled).toBe(true);
    await act(async () => resolve(result));
    expect(container.textContent).toContain("服务器校验通过");
    expect(container.textContent).toContain("本次未保存或发布内容");
    expect(button().disabled).toBe(false);
  });

  it("does not display a successful response for a form edited while the request was pending", async () => {
    let resolve!: (value: AdminContentPreflightResult) => void;
    const onPreview = () => new Promise<AdminContentPreflightResult>((done) => { resolve = done; });
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={onPreview} />));
    await act(async () => button().click());
    await act(async () => root.render(<AdminContentPreflight record={{ ...record, content_zh: "新正文" }} onPreview={onPreview} />));
    await act(async () => resolve(result));
    expect(container.textContent).toContain("请重新预检当前内容");
    expect(container.textContent).not.toContain("服务器校验通过");
  });

  it("invalidates a completed result when the loaded row revision changes", async () => {
    const onPreview = vi.fn().mockResolvedValue(result);
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={onPreview} />));
    await act(async () => button().click());
    await act(async () => root.render(<AdminContentPreflight record={{ ...record, updated_at: "2026-10-05T04:03:12.123457+00:00" }} onPreview={onPreview} />));
    expect(container.textContent).not.toContain("服务器校验通过");
    expect(container.textContent).toContain("请重新预检当前内容");
  });

  it("switches both labels and failure explanations immediately without exposing server diagnostics", async () => {
    const onPreview = vi.fn().mockRejectedValue(new AdminContentPreflightError("protectedContent"));
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={onPreview} />));
    await act(async () => button().click());
    expect(container.textContent).toContain("准确的已审核候选");
    await act(async () => setAdminLang("en"));
    expect(container.textContent).toContain("exact reviewed candidate");
    expect(container.textContent).not.toMatch(/[\u4e00-\u9fff]/);
    expect(container.textContent).not.toContain("protectedContent");
  });

  it("disables preflight for a new record or a missing revision", async () => {
    const onPreview = vi.fn();
    for (const incomplete of [{}, { id: "row-1" }]) {
      await act(async () => root.render(<AdminContentPreflight record={incomplete} onPreview={onPreview} />));
      expect(button().disabled).toBe(true);
      await act(async () => button().click());
    }
    expect(onPreview).not.toHaveBeenCalled();
    expect(container.textContent).toContain("新内容请先保存草稿");
  });

  it("keeps unexpected errors out of the user interface", async () => {
    const onPreview = vi.fn().mockRejectedValue(new Error("raw_backend_diagnostic"));
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={onPreview} />));
    await act(async () => button().click());
    expect(container.textContent).toContain("预检服务暂时不可用");
    expect(container.textContent).not.toContain("raw_backend_diagnostic");
  });

  it("does not update an unmounted editor when a request completes", async () => {
    let resolve!: (value: AdminContentPreflightResult) => void;
    await act(async () => root.render(<AdminContentPreflight record={record} onPreview={() => new Promise((done) => { resolve = done; })} />));
    await act(async () => button().click());
    await act(async () => root.render(null));
    await act(async () => resolve(result));
    expect(container.textContent).toBe("");
  });
});
