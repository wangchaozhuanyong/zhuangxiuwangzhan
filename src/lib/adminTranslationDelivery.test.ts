import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAdminEnglishContent } from "./adminTranslation";
import { getPublicSyncIssues, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";

const fixtures = vi.hoisted(() => ({ generate: vi.fn(), synchronize: vi.fn() }));
vi.mock("@/backend/modules/system", () => ({ generateAdminEnglishContent: fixtures.generate, requestPublicContentInvalidation: fixtures.synchronize }));

const input = { table: "blog_posts", id: "fixture-record", force: true };
const synced = { ok: true, cache_invalidation: { ok: true, revision: "confirmed-revision", edge_purge_requested: { ok: true } } };
const clearRecovery = () => getPublicSyncIssues().forEach((issue) => resolvePublicSyncIssue(issue.key));

beforeEach(() => {
  clearRecovery();
  fixtures.generate.mockReset(); fixtures.synchronize.mockReset();
  fixtures.synchronize.mockResolvedValue(synced);
});
afterEach(clearRecovery);

describe("English content delivery recovery", () => {
  it.each([
    { ok: false, revision: null, edge_purge_requested: { ok: true } },
    { ok: true, revision: "saved-revision", edge_purge_requested: { ok: false } },
  ])("acknowledges saved translations and retries only delivery when %j", async (cache_invalidation) => {
    fixtures.generate.mockResolvedValue({ ok: true, translated: { title_en: "Saved English" }, cache_invalidation });
    const result = await generateAdminEnglishContent(input);
    expect(result).toMatchObject({ ok: true, translated: { title_en: "Saved English" }, publicSyncPending: true });
    const [issue] = getPublicSyncIssues();
    expect(issue?.key).toBe("translation:blog_posts:fixture-record");
    await issue?.retry();
    expect(fixtures.generate).toHaveBeenCalledExactlyOnceWith(input);
    expect(fixtures.synchronize).toHaveBeenCalledExactlyOnceWith({ table: "blog_posts", id: "fixture-record", action: "translation" });
    expect(getPublicSyncIssues()).toHaveLength(0);
  });

  it("keeps recovery available when cache delivery still fails", async () => {
    fixtures.generate.mockResolvedValue({ ok: true, cache_invalidation: { ok: false } });
    fixtures.synchronize.mockResolvedValue({ ok: true, cache_invalidation: { ok: true, edge_purge_requested: { ok: false } } });
    await generateAdminEnglishContent(input);
    const [issue] = getPublicSyncIssues();
    await expect(issue?.retry()).rejects.toThrow("still pending");
    expect(getPublicSyncIssues()).toEqual([issue]);
    fixtures.synchronize.mockResolvedValue(synced);
    await issue?.retry();
    expect(fixtures.generate).toHaveBeenCalledOnce();
    expect(getPublicSyncIssues()).toHaveLength(0);
  });

  it("does not add recovery for a draft translation or a confirmed public delivery", async () => {
    fixtures.generate.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce(synced);
    expect((await generateAdminEnglishContent(input)).publicSyncPending).toBe(false);
    expect((await generateAdminEnglishContent(input)).publicSyncPending).toBe(false);
    expect(getPublicSyncIssues()).toHaveLength(0);
    expect(fixtures.synchronize).not.toHaveBeenCalled();
  });

  it("does not hide a newer pending translation when an earlier retry finishes", async () => {
    fixtures.generate.mockResolvedValue({ ok: true, cache_invalidation: { ok: false } });
    let finishRetry!: (value: typeof synced) => void;
    fixtures.synchronize.mockImplementationOnce(() => new Promise((resolve) => { finishRetry = resolve; }));
    await generateAdminEnglishContent(input);
    const earlier = getPublicSyncIssues()[0]!;
    const pendingRetry = earlier.retry();
    await generateAdminEnglishContent(input);
    const newer = getPublicSyncIssues()[0]!;
    finishRetry(synced); await pendingRetry;
    expect(getPublicSyncIssues()).toEqual([newer]);
    expect(fixtures.generate).toHaveBeenCalledTimes(2);
  });
});
