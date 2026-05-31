import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AdminUserRow } from "@/lib/adminEditorData";
import { useAdminUsers } from "@/lib/adminQueries";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";

const roleLabels: Record<string, string> = {
  super_admin: "超级管理员",
  content_editor: "内容编辑",
  lead_manager: "线索客服",
  viewer: "只读查看",
};

const roleOptions = Object.entries(roleLabels);

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { isSuperAdmin, role } = useAdminAuth();
  const { data: users = [], error, refetch, isFetching } = useAdminUsers();
  const [form, setForm] = useState({ user_id: "", email: "", role: "content_editor" });
  const [message, setMessage] = useState(error instanceof Error ? error.message : error ? String(error) : "");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    await refetch();
  };

  const writeAdminUser = async (payload: Partial<AdminUserRow> & { user_id: string }, existing?: AdminUserRow | null) => {
    await saveAdminRecord({
      table: "admin_users",
      id: existing?.user_id || null,
      idField: "user_id",
      expectedUpdatedAt: existing?.updated_at || null,
      payload,
      action: existing ? "admin_user_update" : "admin_user_insert",
      queryClient,
      invalidate: "none",
      audit: false,
    });
  };

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSuperAdmin || !supabase) return;
    const userId = form.user_id.trim();
    if (!userId) {
      setMessage("请先填写 Supabase 认证用户编号。");
      return;
    }

    setSavingKey("add");
    setMessage("");
    try {
      const withUpdatedAt = await supabase
        .from("admin_users")
        .select("user_id,email,role,active,updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      let existing = withUpdatedAt.data as AdminUserRow | null;
      let findError = withUpdatedAt.error;
      if (findError && String(findError.message || "").includes("updated_at")) {
        const fallback = await supabase.from("admin_users").select("user_id,email,role,active").eq("user_id", userId).maybeSingle();
        existing = fallback.data as AdminUserRow | null;
        findError = fallback.error;
      }
      if (findError) throw findError;

      await writeAdminUser(
        {
          user_id: userId,
          email: form.email.trim() || null,
          role: form.role,
          active: true,
        },
        (existing as AdminUserRow | null) || null,
      );
      setForm({ user_id: "", email: "", role: "content_editor" });
      setMessage("管理员已保存，权限变更已写入操作日志。");
      await refreshUsers();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  const toggleActive = async (user: AdminUserRow) => {
    if (!isSuperAdmin) return;
    const nextActive = !user.active;
    const actionText = nextActive ? "启用" : "停用";
    if (!window.confirm(`确认要${actionText}这个管理员吗？这会影响他是否能进入后台。`)) return;

    setSavingKey(`active:${user.user_id}`);
    setMessage("");
    try {
      await writeAdminUser({ ...user, active: nextActive }, user);
      setMessage(`已${actionText}管理员，操作已记录。`);
      await refreshUsers();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  const updateRole = async (user: AdminUserRow, nextRole: string) => {
    if (!isSuperAdmin || nextRole === user.role) return;
    if (!window.confirm(`确认把 ${user.email || user.user_id} 的角色改成“${roleLabels[nextRole] || nextRole}”吗？`)) return;

    setSavingKey(`role:${user.user_id}`);
    setMessage("");
    try {
      await writeAdminUser({ ...user, role: nextRole }, user);
      setMessage("角色已更新，操作已记录。");
      await refreshUsers();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  const banner = message || (error instanceof Error ? error.message : error ? String(error) : "");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="管理员账户"
        description="管理谁能进入后台，以及每个人能做什么。权限修改属于高风险操作，会记录日志。"
        helpText="只有超级管理员可以新增、停用和修改角色。内容编辑适合改页面，线索客服适合处理咨询，只读账号只能查看。"
      />

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        当前账号角色：<span className="font-semibold text-foreground">{roleLabels[role || ""] || "未知"}</span>
        {!isSuperAdmin && <div className="mt-2 text-destructive">你不是超级管理员，只能查看管理员列表，不能改权限。</div>}
        {!isSupabaseConfigured && <div className="mt-2 text-destructive">Supabase 未配置，无法管理后台账号。</div>}
        {banner && <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">{banner}</div>}
      </div>

      {isSuperAdmin && (
        <form onSubmit={addUser} className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">新增或更新管理员</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium">认证用户编号</label>
              <Input
                value={form.user_id}
                onChange={(event) => setForm({ ...form, user_id: event.target.value })}
                placeholder="从 Supabase Auth 用户资料复制 user_id"
                disabled={savingKey === "add"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">邮箱</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="admin@example.com"
                disabled={savingKey === "add"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">角色</label>
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={savingKey === "add"}
              >
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!isSupabaseConfigured || savingKey === "add"}>
              {savingKey === "add" ? "保存中..." : "保存管理员"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {isFetching && <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">正在刷新管理员列表...</div>}
        {users.map((user) => (
          <article key={user.user_id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="break-all font-semibold">{user.email || "未设置邮箱"}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{user.user_id}</p>
                <p className="mt-1 text-xs text-muted-foreground">状态：{user.active ? "启用" : "停用"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={user.role || "super_admin"}
                  onChange={(event) => void updateRole(user, event.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!isSuperAdmin || savingKey === `role:${user.user_id}`}
                >
                  {roleOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => void toggleActive(user)}
                  disabled={!isSuperAdmin || savingKey === `active:${user.user_id}`}
                >
                  {savingKey === `active:${user.user_id}` ? "处理中..." : user.active ? "停用" : "启用"}
                </Button>
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">暂无管理员账户。</div>}
      </div>
    </div>
  );
};

export default AdminUsers;
