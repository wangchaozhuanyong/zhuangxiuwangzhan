import { requireAdminAccess } from "./admin-auth.ts";

const growthPermissions = {
  export: { secret: "GROWTH_EXPORT_SECRET", roles: ["super_admin", "lead_manager"] },
  notify: { secret: "GROWTH_NOTIFY_SECRET", roles: ["super_admin"] },
} as const;

export async function requireGrowthAccess(
  request: Request,
  client: Parameters<typeof requireAdminAccess>[1],
  operation: keyof typeof growthPermissions,
) {
  const permission = growthPermissions[operation];
  const access = await requireAdminAccess(request, client, { cronSecretEnv: permission.secret });
  if (!access.ok || access.mode === "cron") return access;
  if (permission.roles.some(role => role === access.role)) return access;
  return { ...access, ok: false, status: 403, error: "Growth operation permission required" };
}
