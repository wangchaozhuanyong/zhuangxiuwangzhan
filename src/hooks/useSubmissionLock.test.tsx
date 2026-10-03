import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubmissionLock } from "./useSubmissionLock";

let root: Root, lock: ReturnType<typeof useSubmissionLock>;
beforeEach(async () => {
  root = createRoot(document.createElement("div"));
  function Probe() { lock = useSubmissionLock(); return null; }
  await act(async () => root.render(<Probe />));
});
afterEach(async () => { await act(async () => root.unmount()); });

describe("submission coordination", () => {
  it("locks before asynchronous validation and releases for explicit retry", async () => {
    let complete!: () => void;
    const action = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    const save = lock.protectSubmission("save", action);
    let pending!: ReturnType<typeof save>;
    await act(async () => { pending = save(); void save(); });
    expect(action).toHaveBeenCalledOnce();
    expect(lock.isSubmitting).toBe(true);
    await act(async () => { complete(); await pending; });
    expect(lock.isSubmitting).toBe(false);
    const failing = lock.protectSubmission("save", async () => { throw new Error("fixture"); });
    await act(async () => { await expect(failing()).rejects.toThrow("fixture"); });
    expect(lock.isSubmitting).toBe(false);
    await act(async () => { pending = save(); complete(); await pending; });
    expect(action).toHaveBeenCalledTimes(2);
  });
  it("serializes every autosave patch instead of dropping a later blur", async () => {
    let complete!: () => void;
    const order: string[] = [];
    const save = lock.queueSubmission("record", async (value: string) => {
      order.push(value);
      if (value === "first") await new Promise<void>(resolve => { complete = resolve; });
    });
    let first!: Promise<void>, second!: Promise<void>;
    await act(async () => { first = save("first"); second = save("second"); });
    expect(order).toEqual(["first"]);
    expect(lock.isSubmitting).toBe(true);
    await act(async () => { complete(); await Promise.all([first, second]); });
    expect(order).toEqual(["first", "second"]);
    expect(lock.isSubmitting).toBe(false);
  });
});
