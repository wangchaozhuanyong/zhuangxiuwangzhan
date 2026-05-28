import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";

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
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-bold">管理员账号 / Admin Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">只管理后台白名单。不会显示或使用 service role key。</p>
          {message && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
        </div>

        <form onSubmit={addUser} className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">新增管理员</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium">Auth User ID</label>
              <Input value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} placeholder="Supabase Auth user UUID" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@example.com" />
            </div>
            <Button type="submit">添加</Button>
          </div>
        </form>

        <div className="space-y-3">
          {users.map((user) => (
            <article key={user.user_id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{user.email || user.user_id}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{user.user_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{user.active ? "active" : "inactive"} · {new Date(user.created_at).toLocaleString()}</p>
                </div>
                <Button variant="outline" onClick={() => void toggleActive(user)}>{user.active ? "停用" : "启用"}</Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
