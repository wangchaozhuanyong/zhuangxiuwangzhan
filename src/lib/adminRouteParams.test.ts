import { describe, expect, it } from "vitest";
import { getAdminReturnPath, isNewAdminRouteRecord } from "./adminRouteParams";

describe("isNewAdminRouteRecord", () => {
  it("treats both missing route ids and explicit new ids as create mode", () => {
    expect(isNewAdminRouteRecord(undefined)).toBe(true);
    expect(isNewAdminRouteRecord(null)).toBe(true);
    expect(isNewAdminRouteRecord("new")).toBe(true);
  });

  it("treats persisted record ids as edit mode", () => {
    expect(isNewAdminRouteRecord("f09b37ca-464d-494d-8619-25647c1a5f14")).toBe(false);
  });
});

describe("admin login return path", () => {
  it("keeps admin context and normalizes a local child route", () => {
    expect(getAdminReturnPath("/admin/leads?status=new#test-lead")).toBe("/admin/leads?status=new#test-lead");
    expect(getAdminReturnPath("/admin/projects/../dashboard")).toBe("/admin/dashboard");
  });

  it.each([undefined, null, 123, "/admin", "/admin/", "/administrator", "/admin?next=//evil.test",
    "https://evil.test/admin/leads", "//evil.test/admin", "/admin/../../en", "/admin/%2e%2e/en",
    "/admin/\\evil.test", "/admin/%5cevil.test", "/admin/%2f%2fevil.test", "/admin/\nleads", "/admin/%ZZ"])(
    "falls back for a non-admin or malformed destination %s", (path) => {
      expect(getAdminReturnPath(path)).toBe("/admin/dashboard");
    },
  );
});
