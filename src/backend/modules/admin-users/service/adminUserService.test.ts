import { describe, expect, it } from "vitest";
import { isProtectedAdminUserMutationError } from "@/backend/modules/admin-users/service/adminUserService";

describe("isProtectedAdminUserMutationError", () => {
  it("recognizes self-demotion and last-super-admin database guards", () => {
    expect(isProtectedAdminUserMutationError(new Error("self_admin_role_change_forbidden"))).toBe(true);
    expect(isProtectedAdminUserMutationError({ message: "last_super_admin_required" })).toBe(true);
    expect(isProtectedAdminUserMutationError(new Error("admin_user_identity_change_forbidden"))).toBe(true);
  });

  it("does not classify unrelated database errors as role protection", () => {
    expect(isProtectedAdminUserMutationError(new Error("permission denied"))).toBe(false);
    expect(isProtectedAdminUserMutationError(null)).toBe(false);
  });
});
