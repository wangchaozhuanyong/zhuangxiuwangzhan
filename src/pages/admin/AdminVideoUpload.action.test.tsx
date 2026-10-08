import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import AdminVideoUpload from "./AdminVideoUpload";
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
describe("video upload action", () => {
  it("opens the existing file picker without uploading before a selection", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div"); document.body.append(container); const root = createRoot(container);
    const onUploaded = vi.fn();
    await act(async () => root.render(<AdminVideoUpload onUploaded={onUploaded} />));
    const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(picker, "click").mockImplementation(() => {});
    await act(async () => container.querySelector("button")!.click());
    expect(click).toHaveBeenCalledOnce(); expect(onUploaded).not.toHaveBeenCalled();
    await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals();
  });
});
