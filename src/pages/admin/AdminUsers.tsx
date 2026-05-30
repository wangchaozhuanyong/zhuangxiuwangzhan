import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AdminUserRow } from "@/lib/adminEditorData";
import { useAdminUsers } from "@/lib/adminQueries";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { data: users = [], error, refetch } = useAdminUsers();
  const [form, setForm] = useState({ user_id: "", email: "", role: "content_editor" });
  const [message, setMessage] = useState(error instanceof Error ? error.message : error ? String(error) : "");

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.user_id.trim()) return;
    const { error: upsertError } = await supabase!.from("admin_users").upsert({
      user_id: form.user_id.trim(),
      email: form.email.trim() || null,
      role: form.role,
      active: true,
    });
    if (upsertError) setMessage(upsertError.message);
    else {
      setForm({ user_id: "", email: "", role: "content_editor" });
      await refreshUsers();
      await refetch();
    }
  };

  const toggleActive = async (user: Pick<AdminUserRow, "user_id" | "active">) => {
    const { error: updateError } = await supabase!.from("admin_users").update({ active: !user.active }).eq("user_id", user.user_id);
    if (updateError) setMessage(updateError.message);
    else {
      await refreshUsers();
      await refetch();
    }
  };

  const updateRole = async (user: Pick<AdminUserRow, "user_id">, role: string) => {
    const { error: updateError } = await supabase!.from("admin_users").update({ role }).eq("user_id", user.user_id);
    if (updateError) setMessage(updateError.message);
    else {
      await refreshUsers();
      await refetch();
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="管理员账户"
        description="这里只管理后台白名单，不会显示或使用服务端密钥。"
        helpText="这里是控制谁能进后台的地方。先填认证用户编号，再选角色和启用状态。"
      />

      <div className="rounded-xl border border-border bg-card p-6">
        {message && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
        {!isSupabaseConfigured && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">Supabase 未配置。</p>}
      </div>

      <form onSubmit={addUser} className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-xl font-bold">新增管理员</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium">认证用户编号</label>
            <Input value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} placeholder="填写从 Supabase 用户资料复制来的编号" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">邮箱</label>
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">角色</label>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="super_admin">超级管理员</option>
              <option value="content_editor">内容编辑</option>
              <option value="lead_manager">咨询客服</option>
              <option value="viewer">只读查看</option>
            </select>
          </div>
          <Button type="submit" disabled={!isSupabaseConfigured}>添加</Button>
        </div>
      </form>

      <div className="space-y-3">
        {users.map((user) => (
          <article key={user.user_id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold break-all">{user.email || "未设置账号"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={user.role || "super_admin"}
                  onChange={(event) => void updateRole(user, event.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="super_admin">超级管理员</option>
                  <option value="content_editor">内容编辑</option>
                  <option value="lead_manager">咨询客服</option>
                  <option value="viewer">只读查看</option>
                </select>
                <Button variant="outline" onClick={() => void toggleActive(user)}>{user.active ? "停用" : "启用"}</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
