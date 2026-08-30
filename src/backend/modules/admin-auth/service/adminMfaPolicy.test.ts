import { describe, expect, it } from "vitest";
import { decideAdminMfaStep } from "@/backend/modules/admin-auth/service/adminMfaPolicy";

describe("decideAdminMfaStep", () => {
  it("requires a signed-in session", () => {
    expect(
      decideAdminMfaStep({
        hasSession: false,
        isAdminIdentity: false,
        currentLevel: null,
        verifiedTotpFactorId: null,
      }),
    ).toBe("signed-out");
  });

  it("denies authenticated users outside the admin allowlist", () => {
    expect(
      decideAdminMfaStep({
        hasSession: true,
        isAdminIdentity: false,
        currentLevel: "aal1",
        verifiedTotpFactorId: null,
      }),
    ).toBe("denied");
  });

  it("accepts an aal2 admin session", () => {
    expect(
      decideAdminMfaStep({
        hasSession: true,
        isAdminIdentity: true,
        currentLevel: "aal2",
        verifiedTotpFactorId: "factor-1",
      }),
    ).toBe("complete");
  });

  it("challenges a verified TOTP factor", () => {
    expect(
      decideAdminMfaStep({
        hasSession: true,
        isAdminIdentity: true,
        currentLevel: "aal1",
        verifiedTotpFactorId: "factor-1",
      }),
    ).toBe("challenge");
  });

  it("enrolls TOTP when the admin has no verified factor", () => {
    expect(
      decideAdminMfaStep({
        hasSession: true,
        isAdminIdentity: true,
        currentLevel: "aal1",
        verifiedTotpFactorId: null,
      }),
    ).toBe("enroll");
  });
});
