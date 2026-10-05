import { afterEach, expect, it, vi } from "vitest";
import { completePublicSync, getPublicSyncIssues, registerPublicSyncIssue, resolvePublicSyncIssue } from "./publicSyncRecovery";
afterEach(() => getPublicSyncIssues().forEach(issue => resolvePublicSyncIssue(issue.key)));
it("acknowledges an image write even if delivery fails; retry runs only delivery", async () => {
  const write = vi.fn().mockResolvedValue({ id: "fixture" });
  const delivery = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true });
  const saved = await write();
  expect(await completePublicSync("image:fixture", delivery)).toBe(false);
  expect(saved.id).toBe("fixture");
  await getPublicSyncIssues()[0].retry();
  expect(write).toHaveBeenCalledOnce();
  expect(delivery).toHaveBeenCalledTimes(2);
  expect(getPublicSyncIssues()).toEqual([]);
});

it("does not let an older retry clear a newer failure for the same saved record", async () => {
  let completeRetry!: () => void;
  const pending = new Promise<void>((resolve) => { completeRetry = resolve; });
  const delivery = vi.fn().mockRejectedValueOnce(new Error("first delivery failed")).mockReturnValueOnce(pending);
  await completePublicSync("image:fixture", delivery);
  const olderRetry = getPublicSyncIssues()[0]!.retry();
  const newer = { key: "image:fixture", retry: vi.fn().mockResolvedValue(undefined) };
  registerPublicSyncIssue(newer);
  completeRetry(); await olderRetry;
  expect(getPublicSyncIssues()).toEqual([newer]);
  expect(newer.retry).not.toHaveBeenCalled();
});

it("preserves a failure registered while an earlier initial delivery is pending", async () => {
  let completeDelivery!: () => void;
  const pending = new Promise<void>((resolve) => { completeDelivery = resolve; });
  const delivery = completePublicSync("image:fixture", () => pending);
  const newer = { key: "image:fixture", retry: vi.fn().mockResolvedValue(undefined) };
  registerPublicSyncIssue(newer);
  completeDelivery(); await delivery;
  expect(getPublicSyncIssues()).toEqual([newer]);
});

it("retains explicit legacy clearing by key and conditional clearing by identity", () => {
  const previous = { key: "image:fixture", retry: async () => {} };
  const current = { key: "image:fixture", retry: async () => {} };
  registerPublicSyncIssue(current);
  resolvePublicSyncIssue(current.key, previous);
  expect(getPublicSyncIssues()).toEqual([current]);
  resolvePublicSyncIssue(current.key, current);
  expect(getPublicSyncIssues()).toEqual([]);
  registerPublicSyncIssue(current);
  resolvePublicSyncIssue(current.key);
  expect(getPublicSyncIssues()).toEqual([]);
});
