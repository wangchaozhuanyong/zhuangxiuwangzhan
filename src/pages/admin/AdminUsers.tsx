import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminActionButton } from "@/components/admin/AdminPermission";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { AdminUserRow } from "@/lib/adminEditorData";
import { useAdminUsers } from "@/lib/adminSystemQueries";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { adminUserRoleLabels, adminUsersText } from "@/i18n/adminUsersText";
import { getAdminLang } from "@/lib/adminLocale";
import { formatUserFacingError } from "@/lib/userFacingText";
import {
  getAdminUserForUpsert,
  saveAdminUser,
} from "@/backend/modules/admin-users/service/adminUserService";

const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

const AdminUsers = () => {
  const language = getAdminLang();
  const text = adminUsersText[language];
  const roleLabels = adminUserRoleLabels[language];
  const roleOptions = Object.entries(roleLabels);
  const queryClient = useQueryClient();
  const { isSuperAdmin, role } = useAdminAuth();
  const { data: users = [], error, refetch, isFetching } = useAdminUsers();
  const [form, setForm] = useState({ user_id: "", email: "", role: "content_editor" });
  const [message, setMessage] = useState(error ? formatUserFacingError(error, language) : "");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    await refetch();
  };

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSuperAdmin || !isSupabaseConfigured) return;
    const userId = form.user_id.trim();
    if (!userId) {
      setMessage(text.missingUserId);
      return;
    }

    setSavingKey("add");
    setMessage("");
    try {
      const existing = await getAdminUserForUpsert(userId);
      await saveAdminUser(
        {
          user_id: userId,
          email: form.email.trim() || null,
          role: form.role,
          active: true,
        },
        existing,
        queryClient,
      );
      setForm({ user_id: "", email: "", role: "content_editor" });
      setMessage(text.saved);
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
    const actionText = nextActive ? text.enable : text.disable;
    const confirmed = await adminConfirm({
      title: formatText(text.confirmToggleTitle, { action: actionText }),
      description: formatText(text.confirmToggleDescription, { user: user.email || user.user_id }),
      confirmLabel: actionText,
    });
    if (!confirmed) return;

    setSavingKey(`active:${user.user_id}`);
    setMessage("");
    try {
      await saveAdminUser({ ...user, active: nextActive }, user, queryClient);
      setMessage(formatText(text.toggled, { action: actionText }));
      await refreshUsers();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  const updateRole = async (user: AdminUserRow, nextRole: string) => {
    if (!isSuperAdmin || nextRole === user.role) return;
    const confirmed = await adminConfirm({
      title: text.confirmRoleTitle,
      description: formatText(text.confirmRoleDescription, {
        user: user.email || user.user_id,
        role: roleLabels[nextRole as keyof typeof roleLabels] || nextRole,
      }),
      confirmLabel: text.confirmRoleLabel,
    });
    if (!confirmed) return;

    setSavingKey(`role:${user.user_id}`);
    setMessage("");
    try {
      await saveAdminUser({ ...user, role: nextRole }, user, queryClient);
      setMessage(text.roleUpdated);
      await refreshUsers();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  const banner = message || (error ? formatUserFacingError(error, language) : "");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={text.title}
        description={text.description}
        helpText={text.helpText}
      />

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{text.currentRole}<span className="font-semibold text-foreground">{roleLabels[role as keyof typeof roleLabels] || text.unknownRole}</span>
        {!isSuperAdmin && <div className="mt-2 text-destructive">{text.notSuperAdmin}</div>}
        {!isSupabaseConfigured && <div className="mt-2 text-destructive">{text.supabaseMissing}</div>}
        {banner && <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">{banner}</div>}
      </div>

      {isSuperAdmin && (
        <form onSubmit={addUser} className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{text.formTitle}</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium">{text.userIdLabel}</label>
              <Input
                value={form.user_id}
                onChange={(event) => setForm({ ...form, user_id: event.target.value })}
                placeholder={text.userIdPlaceholder}
                disabled={savingKey === "add"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{text.emailLabel}</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="admin@example.com"
                disabled={savingKey === "add"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{text.roleLabel}</label>
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
            <AdminActionButton action="users.manage" type="submit" disabled={!isSupabaseConfigured || savingKey === "add"}>
              {savingKey === "add" ? text.saving : text.saveAdmin}
            </AdminActionButton>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {isFetching && <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{text.refreshing}</div>}
        {users.map((user) => (
          <article key={user.user_id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="break-all font-semibold">{user.email || text.noEmail}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{user.user_id}</p>
                <p className="mt-1 text-xs text-muted-foreground">{text.statusPrefix}{user.active ? text.active : text.inactive}</p>
              </div>
              <div data-admin-card-actions className="flex flex-wrap gap-2">
                <select
                  value={user.role || "super_admin"}
                  onChange={(event) => void updateRole(user, event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-auto"
                  disabled={!isSuperAdmin || savingKey === `role:${user.user_id}`}
                >
                  {roleOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <AdminActionButton
                  action="users.manage"
                  variant="outline"
                  onClick={() => void toggleActive(user)}
                  disabled={!isSuperAdmin || savingKey === `active:${user.user_id}`}
                >
                  {savingKey === `active:${user.user_id}` ? text.processing : user.active ? text.disable : text.enable}
                </AdminActionButton>
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{text.empty}</div>}
      </div>
    </div>
  );
};

export default AdminUsers;
