import { act, memo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLanguagePage from "@/components/admin/AdminLanguagePage";
import { getAdminLang, setAdminLang } from "@/lib/adminLocale";

describe("admin page language subscription", () => {
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });

  it("updates a cached page immediately without remounting its edited form", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    let mounts = 0;
    let edit: (value: string) => void = () => {};
    const CachedEditor = memo(function CachedEditor() {
      const [value, setValue] = useState("original"); edit = setValue;
      useEffect(() => { mounts += 1; }, []);
      // Existing pages read the current language during render.
      const title = getAdminLang() === "zh" ? "中文标题" : "Chinese title";
      return <><label htmlFor="draft-field">{title}</label><input id="draft-field" value={value} onChange={event => setValue(event.target.value)} /></>;
    });
    const container = document.createElement("div"); document.body.appendChild(container);
    const root = createRoot(container);
    const cachedPage = <CachedEditor />;
    try {
      await act(async () => root.render(<AdminLanguagePage>{cachedPage}</AdminLanguagePage>));
      await act(async () => edit("unsaved QA draft"));
      const input = container.querySelector("input")!;
      await act(async () => setAdminLang("en"));
      expect(container.querySelector("label")!.textContent).toBe("Chinese title");
      expect(container.querySelector("input")).toBe(input);
      expect(input.value).toBe("unsaved QA draft");
      await act(async () => setAdminLang("zh"));
      expect(container.querySelector("label")!.textContent).toBe("中文标题");
      expect(input.value).toBe("unsaved QA draft");
      expect(mounts).toBe(1);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
