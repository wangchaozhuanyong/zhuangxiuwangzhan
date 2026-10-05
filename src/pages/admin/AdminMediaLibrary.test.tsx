import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminMediaLibrary from "./AdminMediaLibrary";
import { setAdminLang } from "@/lib/adminLocale";

const fixtures = vi.hoisted(() => ({
  remove: vi.fn(),
  assets: [{ id: "sample-media", file_url: "/sample.webp", file_name: "Sample image", mime_type: "image/webp", width: 640, height: 480, size_bytes: 1024, usage_type: "general" }],
}));
vi.mock("@/lib/adminMediaQueries", () => ({
  useAdminMediaAssets: () => ({ data: { rows: fixtures.assets, count: fixtures.assets.length, pageSize: 30 }, isFetching: false, isPlaceholderData: false }),
  useCreateAdminMediaAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAdminMediaAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAdminMediaAsset: () => ({ mutateAsync: fixtures.remove, isPending: false }),
}));
vi.mock("./AdminImageUpload", () => ({ default: () => null }));
vi.mock("./AdminVideoUpload", () => ({ default: () => null }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

async function click(button: HTMLButtonElement) {
  await act(async () => { button.focus(); button.click(); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

describe("media library action menu confirmation", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    fixtures.remove.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(["取消", "关闭"])("returns to the same media card after %s without deleting it", async (label) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter><TooltipProvider><AdminMediaLibrary /></TooltipProvider></MemoryRouter>));
      const trigger = container.querySelector<HTMLButtonElement>('article button[aria-label="更多操作"]')!;
      await click(trigger);
      const menuAction = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "删除记录")!;
      await click(menuAction);
      expect(menuAction.isConnected).toBe(false);
      const dialog = document.querySelector('[role="dialog"]')!;
      const close = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === label)!;
      await click(close);
      expect(fixtures.remove).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(trigger);
    } finally {
      await act(async () => root.unmount());
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      container.remove();
    }
  });

  it("returns focus to upload when the confirmed deletion removes the original card", async () => {
    const originalAssets = fixtures.assets;
    fixtures.remove.mockImplementation(async () => { fixtures.assets = []; });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter><TooltipProvider><AdminMediaLibrary /></TooltipProvider></MemoryRouter>));
      const trigger = container.querySelector<HTMLButtonElement>('article button[aria-label="更多操作"]')!;
      const upload = container.querySelector<HTMLButtonElement>('button[aria-controls="admin-media-upload"]')!;
      await click(trigger);
      const menuAction = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "删除记录")!;
      await click(menuAction);
      const confirm = Array.from(document.querySelector('[role="dialog"]')!.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "删除记录")!;
      await click(confirm);
      expect(fixtures.remove).toHaveBeenCalledExactlyOnceWith("sample-media");
      expect(trigger.isConnected).toBe(false);
      expect(document.activeElement).toBe(upload);
    } finally {
      await act(async () => root.unmount());
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      container.remove();
      fixtures.assets = originalAssets;
    }
  });
});
