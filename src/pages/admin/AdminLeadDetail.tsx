import { FormEvent, useEffect, useState } from "react";
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
import { getAdminLang } from "@/lib/adminLocale";
import { adminLeadDetailText, adminLeadFollowupTypeLabels } from "@/i18n/adminLeadDetailText";
import { translateProjectType, translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";
import { formatSourcePath, formatUserFacingError } from "@/lib/userFacingText";

const statuses = ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];
const followupTypes = ["note", "call", "whatsapp", "site_visit", "quotation", "closed"];

type AdminLeadDetailTextKey = keyof typeof adminLeadDetailText;
type AdminLeadFollowupTypeKey = keyof typeof adminLeadFollowupTypeLabels;

const A = (key: AdminLeadDetailTextKey) => adminLeadDetailText[key][getAdminLang()];

const formatA = (key: AdminLeadDetailTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

const followupTypeLabel = (type: string) =>
  type in adminLeadFollowupTypeLabels ? adminLeadFollowupTypeLabels[type as AdminLeadFollowupTypeKey][getAdminLang()] : type;

const AdminLeadDetail = () => {
  const lang = getAdminLang();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, error } = useAdminLead(id);
  const [lead, setLead] = useState<any>(null);
  const [content, setContent] = useState("");
  const [followupType, setFollowupType] = useState("note");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [message, setMessage] = useState("");
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const leadWritePermission = useAdminPermission("lead.write");
  const canWriteLead = leadWritePermission.allowed;

  useEffect(() => {
    if (data?.lead) setLead(data.lead);
  }, [data?.lead]);

  const followups = data?.followups ?? [];
  const loadError = error ? formatUserFacingError(error, lang) : "";
  const whatsappHref = lead ? whatsappHrefFromPhone(lead.phone) : "";
  const telHref = lead ? telHrefFromPhone(lead.phone) : "";

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    ]);
  };

  const updateLead = async (patch: Record<string, unknown>, label = A("defaultFieldLabel")) => {
    if (!id) return;
    if (!canWriteLead) {
      setMessage(A("readOnlyLead"));
      return;
    }
    setSavingField(label);
    setMessage(formatA("savingField", { label }));
    try {
      await updateAdminLead(id, patch);
      setMessage(formatA("savedField", { label }));
      await refresh();
    } catch (updateError) {
      setMessage(formatA("saveFieldFailed", { label, reason: formatAdminMutationError(updateError) }));
    } finally {
      setSavingField(null);
    }
  };

  const addFollowup = async (event: FormEvent) => {
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
    setSavingFollowup(true);
    setMessage("");
    try {
      const result = await addAdminLeadFollowup({
        leadId: id,
        followupType,
        content,
        nextFollowUpAt,
      });
      if (result.syncError) {
        setMessage(formatA("followupSavedSyncFailed", { reason: formatAdminMutationError(result.syncError) }));
        return;
      }
      setContent("");
      setNextFollowUpAt("");
      setMessage(A("followupSaved"));
      await refresh();
    } catch (insertError) {
      setMessage(formatAdminMutationError(insertError));
    } finally {
      setSavingFollowup(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
        <AdminPageHeader
          title={A("pageTitle")}
          description={A("pageDescription")}
          helpText={A("pageHelpText")}
        />
        {!canWriteLead && <AdminReadOnlyNotice />}

        {(message || loadError) && <div role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-4 text-sm">{message || loadError}</div>}
        {lead && (
          <>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-bold sm:text-2xl">{lead.name || A("leadFallback")}</h1>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{lead.phone} · {lead.email || "-"}</p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{formatSourcePath(lead.source_path, lang)} · {new Date(lead.created_at).toLocaleString()}</p>
                </div>
                <div data-admin-card-actions className="flex gap-2">
                  {whatsappHref ? <Button asChild variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></Button> : <Button variant="outline" disabled>WhatsApp</Button>}
                  {telHref ? <Button asChild variant="outline"><a href={telHref}>{A("call")}</a></Button> : <Button variant="outline" disabled>{A("call")}</Button>}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <h2 className="mb-4 font-display text-xl font-bold">{A("pageTitle")}</h2>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div><span className="text-muted-foreground">{A("projectType")}</span> {lead.project_type ? translateProjectType(lead.project_type, lang) : "-"}</div>
                  <div><span className="text-muted-foreground">{A("budget")}</span> {lead.budget_range || "-"}</div>
                  <div className="md:col-span-2"><span className="text-muted-foreground">{A("message")}</span><p className="mt-1 whitespace-pre-wrap">{lead.message || "-"}</p></div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{A("status")}</label>
                    <select
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
                    <label className="mb-1 block text-sm font-medium">{A("nextFollowUp")}</label>
                    <Input type="datetime-local" value={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : ""} onChange={(event) => setLead({ ...lead, next_follow_up_at: event.target.value })} onBlur={() => void updateLead({ next_follow_up_at: lead.next_follow_up_at || null }, A("nextFollowUp"))} disabled={!canWriteLead || savingField === A("nextFollowUp")} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">{A("notes")}</label>
                    <Textarea rows={4} value={lead.notes || ""} onChange={(event) => setLead({ ...lead, notes: event.target.value })} onBlur={() => void updateLead({ notes: lead.notes || null }, A("notes"))} disabled={!canWriteLead || savingField === A("notes")} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <h2 className="mb-4 font-display text-xl font-bold">{A("addFollowup")}</h2>
                <form onSubmit={addFollowup} className="space-y-3">
                  <select value={followupType} onChange={(event) => setFollowupType(event.target.value)} disabled={!canWriteLead} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {followupTypes.map((item) => <option key={item} value={item}>{followupTypeLabel(item)}</option>)}
                  </select>
                  <Textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder={A("followupPlaceholder")} disabled={!canWriteLead} />
                  <Input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} disabled={!canWriteLead} />
                  <AdminActionButton action="lead.write" type="submit" className="w-full" disabled={savingFollowup} aria-busy={savingFollowup}>
                    {savingFollowup ? A("saving") : A("saveFollowup")}
                  </AdminActionButton>
                </form>
              </section>
            </div>

            <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
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
