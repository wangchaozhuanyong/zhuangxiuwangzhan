import { invalidateAdminResource } from "@/lib/adminInvalidate";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AdminActionButton, useAdminPermission } from "@/components/admin/AdminPermission";
import { AdminReadOnlyNotice } from "@/components/admin/AdminRoleGate";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAdminLead } from "@/lib/adminLeadQueries";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { addAdminLeadFollowup, updateAdminLead } from "@/backend/modules/leads/service/leadService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminMobileSaveText } from "@/i18n/adminMobileSaveText";
import { getAdminLang } from "@/lib/adminLocale";
import { adminLeadDetailText, adminLeadFollowupTypeLabels } from "@/i18n/adminLeadDetailText";
import { translateProjectType, translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";
import { formatSourcePath, formatUserFacingError } from "@/lib/userFacingText";

const statuses = ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];
const followupTypes = ["note", "call", "whatsapp", "site_visit", "quotation", "closed"];

type AdminLeadDetailTextKey = keyof typeof adminLeadDetailText;
type AdminLeadFollowupTypeKey = keyof typeof adminLeadFollowupTypeLabels;
type AdminLeadDetailRow = Record<string, unknown> & {
  id?: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  source_path?: string | null;
  project_type?: string | null;
  location?: string | null;
  budget_range?: string | null;
  message?: string | null;
  notes?: string | null;
  next_follow_up_at?: string | null;
  created_at?: string | null;
};

const A = (key: AdminLeadDetailTextKey) => adminLeadDetailText[key][getAdminLang()];

const formatA = (key: AdminLeadDetailTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

const followupTypeLabel = (type: string) =>
  type in adminLeadFollowupTypeLabels ? adminLeadFollowupTypeLabels[type as AdminLeadFollowupTypeKey][getAdminLang()] : type;

const AdminLeadDetail = () => {
  const { protectSubmission, queueSubmission, isSubmitting } = useSubmissionLock();
  const lang = getAdminLang();
  const mobileText = adminMobileSaveText[lang];
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useAdminLead(id);
  const { state: lead, setForm: setLead, dirty, applyPatchRemote, getCurrent } = useAdminFormState<AdminLeadDetailRow | null>(data?.lead, { initial: null, resetKey: id });
  const [content, setContent] = useState("");
  const [followupType, setFollowupType] = useState("note");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [message, setMessage] = useState("");
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [pendingSync, setPendingSync] = useState<{ recordId: string; nextFollowUpAt: string; expectedUpdatedAt: string | null } | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const leadWritePermission = useAdminPermission("lead.write");
  const canWriteLead = leadWritePermission.allowed;

  useUnsavedChangesWarning(dirty || !!content.trim() || !!nextFollowUpAt || isSubmitting);

  const followups = data?.followups ?? [];
  const loadError = error ? formatUserFacingError(error, lang) : "";
  const whatsappHref = lead ? whatsappHrefFromPhone(lead.phone) : "";
  const telHref = lead ? telHrefFromPhone(lead.phone) : "";

  const refresh = () => invalidateAdminResource(queryClient, "leads", false);

  const updateLead = queueSubmission("record-autosave", async (patch: Record<string, unknown>, label: string = A("defaultFieldLabel")) => {
    if (!id) return;
    if (!canWriteLead) {
      setMessage(A("readOnlyLead"));
      return;
    }
    setSavingField(label);
    setMessage(formatA("savingField", { label }));
    try {
      const currentVersion = getCurrent()?.updated_at;
      const saved = await updateAdminLead(id, patch, typeof currentVersion === "string" ? currentVersion : null);
      const savedPatch = Object.fromEntries([...Object.keys(patch), "updated_at"].map((key) => [key, saved[key]]));
      applyPatchRemote(savedPatch, { ...patch, updated_at: currentVersion });
      setMessage(formatA("savedField", { label }));
      await refresh();
    } catch (updateError) {
      setMessage(formatA("saveFieldFailed", { label, reason: formatAdminMutationError(updateError, lang) }));
    } finally {
      setSavingField(null);
    }
  });

  const addFollowup = protectSubmission("addFollowup", async (event: FormEvent) => {
    event.preventDefault();
    if (!canWriteLead) {
      setMessage(A("readOnlyFollowup"));
      return;
    }
    if (!id || savingFollowup) return;
    if (!content.trim()) {
      setMessage(A("followupContentRequired"));
      return;
    }
    const submittedRecord = getCurrent();
    const expectedUpdatedAt = typeof submittedRecord?.updated_at === "string" ? submittedRecord.updated_at : null;
    setSavingFollowup(true);
    setMessage("");
    try {
      const result = await addAdminLeadFollowup({
        leadId: id,
        followupType,
        content,
        nextFollowUpAt,
        expectedUpdatedAt,
      });
      setContent((current) => current === content ? "" : current);
      setNextFollowUpAt((current) => current === nextFollowUpAt ? "" : current);
      if (result.syncError) {
        setPendingSync({ recordId: id, nextFollowUpAt, expectedUpdatedAt });
        await refresh();
        setMessage(formatA("followupSavedSyncFailed", { reason: formatAdminMutationError(result.syncError, lang) }));
        return;
      }
      if (result.record) applyPatchRemote({ next_follow_up_at: typeof result.record.next_follow_up_at === "string" ? result.record.next_follow_up_at : null, updated_at: result.record.updated_at }, { next_follow_up_at: submittedRecord?.next_follow_up_at, updated_at: expectedUpdatedAt });
      setPendingSync(null);
      setMessage(A("followupSaved"));
      await refresh();
    } catch (insertError) {
      setMessage(formatAdminMutationError(insertError, lang));
    } finally {
      setSavingFollowup(false);
    }
  });

  const retryFollowupSync = protectSubmission("retryFollowupSync", async () => {
    if (!id || !pendingSync || pendingSync.recordId !== id || !canWriteLead) return;
    try {
      const confirmed = getCurrent();
      const version = typeof confirmed?.updated_at === "string" ? confirmed.updated_at : pendingSync.expectedUpdatedAt;
      const saved = await updateAdminLead(id, { next_follow_up_at: pendingSync.nextFollowUpAt }, version);
      applyPatchRemote({ next_follow_up_at: typeof saved.next_follow_up_at === "string" ? saved.next_follow_up_at : null, updated_at: saved.updated_at }, { next_follow_up_at: confirmed?.next_follow_up_at, updated_at: version });
      setPendingSync(null);
      setMessage(A("followupSaved"));
      await refresh();
    } catch (syncError) {
      setMessage(formatA("followupSavedSyncFailed", { reason: formatAdminMutationError(syncError, lang) }));
    }
  });

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
        <AdminPageHeader
          title={A("pageTitle")}
          description={A("pageDescription")}
          helpText={A("pageHelpText")}
        />
        {!canWriteLead && <AdminReadOnlyNotice />}

        {(message || loadError) && <div role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-4 text-sm">{message || loadError}{pendingSync && pendingSync.recordId === id && <Button type="button" variant="outline" size="sm" className="ml-3" disabled={isSubmitting} onClick={() => void retryFollowupSync()}>{A("retryFollowupSync")}</Button>}</div>}
        {isLoading && <AdminPageSkeleton mode="form" />}
        {lead && (
          <>
            <div className="min-w-0 rounded-xl border border-border bg-card p-4 [overflow-wrap:anywhere] sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h2 className="break-words font-display text-xl font-bold sm:text-2xl">{lead.name || A("leadFallback")}</h2>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{lead.phone} · {lead.email || "-"}</p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{formatSourcePath(lead.source_path, lang)} · {new Date(lead.created_at).toLocaleString()}</p>
                </div>
                <div data-admin-card-actions className="flex gap-2">
                  {whatsappHref ? <Button asChild variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></Button> : <Button variant="outline" disabled>WhatsApp</Button>}
                  {telHref ? <Button asChild variant="outline"><a href={telHref}>{A("call")}</a></Button> : <Button variant="outline" disabled>{A("call")}</Button>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 rounded-xl border border-border bg-card p-4 [overflow-wrap:anywhere] sm:p-6">
                <h2 className="font-display text-xl font-bold">{A("pageTitle")}</h2>
                {canWriteLead && <p className="mb-4 mt-2 text-sm text-muted-foreground">{mobileText.automaticScope}</p>}
                <div className="grid gap-4 text-sm md:grid-cols-2 [&>div]:min-w-0">
                  <div><span className="text-muted-foreground">{A("projectType")}</span> {lead.project_type ? translateProjectType(lead.project_type, lang) : "-"}</div>
                  <div><span className="text-muted-foreground">{A("budget")}</span> {lead.budget_range || "-"}</div>
                  <div className="md:col-span-2"><span className="text-muted-foreground">{A("message")}</span><p className="mt-1 whitespace-pre-wrap">{lead.message || "-"}</p></div>
                  <div>
                    <label htmlFor="lead-status" className="mb-1 block text-sm font-medium">{A("status")}</label>
                    <select
                      id="lead-status"
                      value={lead.status || "new"}
                      onChange={(event) => {
                        if (!canWriteLead) return;
                        const nextStatus = event.target.value;
                        setLead({ ...lead, status: nextStatus });
                        void updateLead({ status: nextStatus }, A("status"));
                      }}
                      disabled={!canWriteLead || savingField === A("status")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {translateStatusLabel("leads", item, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="lead-nextFollowUp" className="mb-1 block text-sm font-medium">{A("nextFollowUp")}</label>
                    <Input id="lead-nextFollowUp" type="datetime-local" value={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : ""} onChange={(event) => setLead({ ...lead, next_follow_up_at: event.target.value })} onBlur={() => void updateLead({ next_follow_up_at: lead.next_follow_up_at || null }, A("nextFollowUp"))} disabled={!canWriteLead || savingField === A("nextFollowUp")} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="lead-notes" className="mb-1 block text-sm font-medium">{A("notes")}</label>
                    <Textarea id="lead-notes" rows={4} value={lead.notes || ""} onChange={(event) => setLead({ ...lead, notes: event.target.value })} onBlur={() => void updateLead({ notes: lead.notes || null }, A("notes"))} disabled={!canWriteLead || savingField === A("notes")} />
                  </div>
                </div>
              </section>

              <section className="min-w-0 rounded-xl border border-border bg-card p-4 [overflow-wrap:anywhere] sm:p-6">
                <h2 className="font-display text-xl font-bold">{A("addFollowup")}</h2>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">{mobileText.followupScope}</p>
                <form onSubmit={addFollowup} className="space-y-3">
                  <label htmlFor="lead-followup-type" className="block text-sm font-medium">{mobileText.followupType}</label>
                  <select id="lead-followup-type" value={followupType} onChange={(event) => setFollowupType(event.target.value)} disabled={!canWriteLead} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {followupTypes.map((item) => <option key={item} value={item}>{followupTypeLabel(item)}</option>)}
                  </select>
                  <label htmlFor="lead-followup-content" className="block text-sm font-medium">{mobileText.followupContent}</label>
                  <Textarea id="lead-followup-content" rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder={A("followupPlaceholder")} disabled={!canWriteLead} />
                  <label htmlFor="lead-followup-next" className="block text-sm font-medium">{A("nextFollowUp")}</label>
                  <Input id="lead-followup-next" type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} disabled={!canWriteLead} />
                  <AdminActionButton action="lead.write" type="submit" className="w-full" disabled={savingFollowup} aria-busy={savingFollowup}>
                    {savingFollowup ? A("saving") : A("saveFollowup")}
                  </AdminActionButton>
                </form>
              </section>
            </div>

            <section className="min-w-0 rounded-xl border border-border bg-card p-4 [overflow-wrap:anywhere] sm:p-6">
              <h2 className="mb-4 font-display text-xl font-bold">{A("timeline")}</h2>
              <div className="space-y-3">
                {followups.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4 text-sm">
                    <p className="font-medium">{followupTypeLabel(item.followup_type)} · {new Date(item.created_at).toLocaleString()}</p>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                    {item.next_follow_up_at && <p className="mt-2 text-xs text-accent">{formatA("nextFollowUpAt", { time: new Date(item.next_follow_up_at).toLocaleString() })}</p>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default AdminLeadDetail;
