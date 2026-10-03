import { afterEach, describe, expect, it } from "vitest";
import { ensureAdminFormAccessibility } from "@/lib/adminLayoutConfig";
import { setAdminLang } from "@/lib/adminLocale";

describe("admin form accessible names", () => {
  afterEach(() => setAdminLang("zh"));

  it("updates generated names after language changes without altering field values", () => {
    const root = document.createElement("main");
    root.innerHTML = '<div><label>中文标题</label><input value="unsaved QA content"></div><input type="file">';
    setAdminLang("zh");
    ensureAdminFormAccessibility(root, true);
    const field = root.querySelector("input")!;
    const upload = root.querySelector('input[type="file"]')!;
    expect(field.getAttribute("aria-label")).toBe("中文标题");
    expect(upload.getAttribute("aria-label")).toBe("后台表单字段");

    root.querySelector("label")!.textContent = "Chinese title";
    setAdminLang("en");
    ensureAdminFormAccessibility(root, true);
    expect(field.getAttribute("aria-label")).toBe("Chinese title");
    expect(upload.getAttribute("aria-label")).toBe("Admin form field");
    expect(field.value).toBe("unsaved QA content");

    root.querySelector("label")!.textContent = "中文标题";
    setAdminLang("zh");
    ensureAdminFormAccessibility(root, true);
    expect(field.getAttribute("aria-label")).toBe("中文标题");
  });

  it("preserves explicit names, including names that replace a generated label", () => {
    const root = document.createElement("main");
    root.innerHTML = '<div><label>Title</label><input></div><input aria-label="Explicit name"><label for="named">Linked label</label><input id="named"><span id="description">Description</span><textarea aria-labelledby="description"></textarea>';
    ensureAdminFormAccessibility(root, true);
    const fields = root.querySelectorAll("input");
    fields[0].setAttribute("aria-label", "Replacement explicit name");
    root.querySelector("label")!.textContent = "Updated title";
    ensureAdminFormAccessibility(root, true);
    expect(fields[0].getAttribute("aria-label")).toBe("Replacement explicit name");
    expect(fields[1].getAttribute("aria-label")).toBe("Explicit name");
    expect(fields[2].hasAttribute("aria-label")).toBe(false);
    expect(root.querySelector("textarea")!.getAttribute("aria-labelledby")).toBe("description");
  });
});
