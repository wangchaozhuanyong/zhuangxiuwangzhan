import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminServiceNativeSnapshot from "./AdminServiceNativeSnapshot";
import { nativeServiceSnapshotTargets as targets } from "@/backend/modules/services/service/nativeServiceSnapshot";

const { read, copy } = vi.hoisted(() => ({ read: vi.fn(), copy: vi.fn() }));
vi.mock("@/backend/modules/services/service/serviceService", () => ({ loadAdminServiceNativeSnapshot: read }));
const value = '{"process_steps_en[4].desc":"fixture","updated_at":"2026-10-06T00:00:00.123456Z"}';
let host: HTMLDivElement; let root: Root;
const oldClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
async function render(serviceId: string = targets.artistic.id, disabled = false, language: "en" | "zh" = "zh") {
  await act(async () => root.render(<AdminServiceNativeSnapshot serviceId={serviceId} disabled={disabled} language={language} />));
}
const button = (label: string) => Array.from(host.querySelectorAll("button")).find((item) => item.textContent === label)!;
describe("normal admin native snapshot control", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); read.mockReset().mockResolvedValue(value); copy.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals();
    if (oldClipboard) Object.defineProperty(navigator, "clipboard", oldClipboard); else Reflect.deleteProperty(navigator, "clipboard");
  });
  it.each(["en", "zh"] as const)("reads only on request and copies only on a separate explicit click in %s", async (language) => {
    await render(targets.artistic.id, false, language); expect(read).not.toHaveBeenCalled();
    await act(async () => button(language === "en" ? "Read verification snapshot" : "读取核对快照").click());
    expect(read).toHaveBeenCalledTimes(1); expect(copy).not.toHaveBeenCalled(); expect(host.textContent).not.toContain("updated_at");
    await act(async () => button(language === "en" ? "Copy verification snapshot" : "复制核对快照").click());
    expect(copy).toHaveBeenCalledExactlyOnceWith(value);
    expect(host.textContent).toContain(language === "en" ? "Verification snapshot copied." : "核对快照已复制。");
    expect(host.querySelectorAll("button")).toHaveLength(1);
  });
  it("never enables reads for Office", async () => {
    await render("office-renovation"); expect(host.childElementCount).toBe(0); expect(read).not.toHaveBeenCalled();
  });
  it("cancels a late result when navigating to a different target", async () => {
    let finish!: (result: string) => void;
    read.mockImplementation(() => new Promise<string>((resolve) => { finish = resolve; }));
    await render(); await act(async () => button("读取核对快照").click());
    const signal = read.mock.calls[0]![1] as AbortSignal;
    await render(targets.bathroom.id); expect(signal.aborted).toBe(true);
    await act(async () => finish(value)); expect(button("复制核对快照")).toBeUndefined(); expect(copy).not.toHaveBeenCalled();
  });
  it("cancels reads and clears the snapshot when a save starts", async () => {
    await render(); await act(async () => button("读取核对快照").click()); expect(button("复制核对快照")).toBeDefined();
    await render(targets.artistic.id, true); expect(button("复制核对快照")).toBeUndefined(); expect(button("读取核对快照").disabled).toBe(true);
  });
  it("shows a safe error instead of exposing a raw backend failure", async () => {
    read.mockRejectedValue(new Error("fixture_internal_failure")); await render(); await act(async () => button("读取核对快照").click());
    expect(host.textContent).toContain("无法取得核对快照"); expect(host.textContent).not.toContain("fixture_internal_failure"); expect(copy).not.toHaveBeenCalled();
  });
  it("can retry clipboard failure without an automatic write or new read", async () => {
    copy.mockRejectedValueOnce(new Error("clipboard denied")); await render(); await act(async () => button("读取核对快照").click());
    await act(async () => button("复制核对快照").click()); expect(host.textContent).toContain("复制失败");
    await act(async () => button("复制核对快照").click()); expect(copy).toHaveBeenCalledTimes(2); expect(read).toHaveBeenCalledTimes(1);
  });
  it("prevents duplicate requests from two clicks in the same render", async () => {
    await render(); const readButton = button("读取核对快照");
    await act(async () => { readButton.click(); readButton.click(); }); expect(read).toHaveBeenCalledTimes(1);
    const copyButton = button("复制核对快照");
    await act(async () => { copyButton.click(); copyButton.click(); }); expect(copy).toHaveBeenCalledTimes(1);
  });
});
