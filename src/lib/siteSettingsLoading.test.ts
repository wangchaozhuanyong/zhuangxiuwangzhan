import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings, fetchSiteSettings, saveSiteSettings } from "@/lib/siteSettingsApi";

const { preload, read, save } = vi.hoisted(() => ({ preload: vi.fn(), read: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: preload }));
vi.mock("@/backend/modules/settings/repository/siteSettingsRepository", () => ({ fetchDefaultSiteSettingsRecord: read, upsertDefaultSiteSettingsRecord: save }));

describe("site settings deferred repository access", () => {
  beforeEach(() => { vi.clearAllMocks(); preload.mockReturnValue(null); });

  it("uses public HTML settings without a repository request", async () => {
    preload.mockReturnValue({ siteSettings: { brand_name: "Fixture brand" } });
    expect(await fetchSiteSettings()).toEqual({ ...fallbackSiteSettings, brand_name: "Fixture brand" });
    expect(read).not.toHaveBeenCalled();
  });

  it("reads the same repository when no public settings were injected", async () => {
    read.mockResolvedValue({ brand_name: "Repository brand" });
    expect(await fetchSiteSettings()).toEqual({ ...fallbackSiteSettings, brand_name: "Repository brand" });
    expect(read).toHaveBeenCalledOnce();
  });

  it("preserves the fallback when the repository returns no settings", async () => {
    read.mockResolvedValue(null);
    expect(await fetchSiteSettings()).toBe(fallbackSiteSettings);
  });

  it("delegates saves unchanged and propagates errors", async () => {
    save.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Fixture failure"));
    await saveSiteSettings(fallbackSiteSettings);
    expect(save).toHaveBeenCalledWith(fallbackSiteSettings);
    await expect(saveSiteSettings(fallbackSiteSettings)).rejects.toThrow("Fixture failure");
  });
});
