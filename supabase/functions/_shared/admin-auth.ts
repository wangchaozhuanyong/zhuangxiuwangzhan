export type EdgeAdminCheck = {
  ok: boolean;
  status: number;
  error: string | null;
  mode: "admin" | "cron";
  role?: string | null;
};

type AdminAuthOptions = {
  cronSecretEnv?: string;
};

export const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

export const requireAdminAccess = async (
  req: Request,
  supabase: any,
  options: AdminAuthOptions = {},
): Promise<EdgeAdminCheck> => {
  const cronSecret = options.cronSecretEnv ? Deno.env.get(options.cronSecretEnv) : null;
  const incomingSecret = req.headers.get("x-cron-secret");
  if (cronSecret && incomingSecret && incomingSecret === cronSecret) {
    return { ok: true, status: 200, error: null, mode: "cron" };
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Missing authorization token", mode: "admin" };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false, status: 401, error: "Invalid authorization token", mode: "admin" };
  }

  const jwtRole = userData.user.app_metadata?.role === "admin" ? "super_admin" : null;
  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id,role,active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return { ok: false, status: 500, error: adminError.message, mode: "admin" };
  if (!adminRow && !jwtRole) return { ok: false, status: 403, error: "Admin access required", mode: "admin" };
  if (adminRow && adminRow.active === false && !jwtRole) {
    return { ok: false, status: 403, error: "Admin account is disabled", mode: "admin" };
  }

  return { ok: true, status: 200, error: null, mode: "admin", role: jwtRole || adminRow?.role || null };
};

export const requireSuperAdminAccess = (adminCheck: EdgeAdminCheck): EdgeAdminCheck => {
  if (!adminCheck.ok) return adminCheck;
  if (adminCheck.mode === "cron") return adminCheck;
  if (adminCheck.role !== "super_admin") {
    return { ok: false, status: 403, error: "Super admin access required", mode: "admin" };
  }
  return adminCheck;
};
