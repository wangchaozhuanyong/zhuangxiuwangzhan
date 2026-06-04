import { describe, expect, it } from "vitest";
import { isNewAdminRouteRecord } from "./adminRouteParams";

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
