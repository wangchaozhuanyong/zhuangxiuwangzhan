import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clearCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

describe("admin locale preference", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    clearCookie("flashcast_admin_lang");
    clearCookie("flashcast_admin_theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    clearCookie("flashcast_admin_lang");
    clearCookie("flashcast_admin_theme");
  });

  it("defaults the admin panel to Chinese", async () => {
    const { getAdminLang } = await import("@/lib/adminLocale");

    expect(getAdminLang()).toBe("zh");
  });

  it("keeps the chosen language available when localStorage writes fail", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { getAdminLang, setAdminLang } = await import("@/lib/adminLocale");

    setAdminLang("en");
    expect(getAdminLang()).toBe("en");

    setAdminLang("zh");
    expect(getAdminLang()).toBe("zh");
  });
});
