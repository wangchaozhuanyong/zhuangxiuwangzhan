import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminConfirmProvider, { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { Button } from "@/components/ui/button";
import { setAdminLang } from "@/lib/adminLocale";

async function click(button: HTMLButtonElement) {
  await act(async () => { button.focus(); button.click(); });
  // Radix restores focus on the next task after its modal focus scope unmounts.
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

async function mountConfirmation(fromMenu: boolean) {
  const result = vi.fn();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const action = <Button type="button" onClick={async () => {
    result(await adminConfirm({ title: "确认操作", description: "测试现有确认行为", confirmLabel: "执行操作" }));
  }}>触发确认</Button>;
  await act(async () => root.render(<><AdminConfirmProvider />{fromMenu ? <AdminActionMenu>{action}</AdminActionMenu> : action}</>));
  return {
    container,
    result,
    async cleanup() {
      await act(async () => root.unmount());
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      container.remove();
    },
  };
}

describe("admin confirmation focus return", () => {
  beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); setAdminLang("zh"); });
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });

  it.each([{ label: "取消", accepted: false }, { label: "执行操作", accepted: true }])(
    "returns focus to More actions after $label when the menu action has unmounted",
    async ({ label, accepted }) => {
      const view = await mountConfirmation(true);
      try {
        const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label="更多操作"]')!;
        await click(trigger);
        const menuAction = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "触发确认")!;
        await click(menuAction);
        expect(menuAction.isConnected).toBe(false);
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.textContent).toContain("确认操作");
        expect(dialog.querySelector(".sr-only")?.textContent).toBe("关闭");
        const closeAction = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === label)!;
        await click(closeAction);
        expect(view.result).toHaveBeenCalledWith(accepted);
        expect(document.activeElement).toBe(trigger);
      } finally { await view.cleanup(); }
    },
  );

  it("keeps direct confirmation focus on its original button and localizes the close control", async () => {
    setAdminLang("en");
    const view = await mountConfirmation(false);
    try {
      const trigger = view.container.querySelector<HTMLButtonElement>("button")!;
      await click(trigger);
      const dialog = document.querySelector('[role="dialog"]')!;
      const close = dialog.querySelector(".sr-only")!.closest("button")!;
      expect(close.textContent).toBe("Close");
      await click(close);
      expect(view.result).toHaveBeenCalledWith(false);
      expect(document.activeElement).toBe(trigger);
    } finally { await view.cleanup(); }
  });
});
