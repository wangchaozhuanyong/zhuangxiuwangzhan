import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import { AdminPageShell } from "./AdminPageShell";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: "", email: "" });
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from("admin_users").select("*").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setUsers(data || []);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.user_id.trim()) return;
    const { error } = await supabase!.from("admin_users").upsert({
      user_id: form.user_id.trim(),
      email: form.email.trim() || null,
      active: true,
    });
    if (error) setMessage(error.message);
    else {
      setForm({ user_id: "", email: "" });
      await loadUsers();
    }
  };

  const toggleActive = async (user: any) => {
    const { error } = await supabase!.from("admin_users").update({ active: !user.active }).eq("user_id", user.user_id);
    if (error) setMessage(error.message);
    else await loadUsers();
  };

  return (
    <AdminLayout>
      <AdminPageShell
        title="管理员账号 / Admin Users"
        description="只管理后台白名单。不会显示或使用 service role key。"
      >
        <div className="space-y-6">
          {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

          <form onSubmit={addUser} className="rounded-xl border border-border bg-card p-4 md:p-6">
            <h2 className="mb-4 font-display text-xl font-bold">新增管理员</h2>
            <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium">Auth User ID</label>
                <Input value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} placeholder="Supabase Auth user UUID" />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@example.com" />
              </div>
              <Button type="submit" className="shrink-0">添加</Button>
            </div>
          </form>

          <div className="space-y-3">
            {users.map((user) => (
              <article key={user.user_id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.email || user.user_id}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{user.user_id}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{user.active ? "active" : "inactive"} · {new Date(user.created_at).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" className="shrink-0" onClick={() => void toggleActive(user)}>{user.active ? "停用" : "启用"}</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminUsers;
