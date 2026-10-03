import { afterEach, expect, it, vi } from "vitest";
import { completePublicSync, getPublicSyncIssues, resolvePublicSyncIssue } from "./publicSyncRecovery";
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
