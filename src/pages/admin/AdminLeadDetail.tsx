import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AdminActionButton, useAdminPermission } from "@/components/admin/AdminPermission";
import { AdminReadOnlyNotice } from "@/components/admin/AdminRoleGate";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAdminLead } from "@/lib/adminQueries";
import { formatAdminMutationError } from "@/lib/adminMutation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminLang } from "@/lib/adminLocale";
import { translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";

const statuses = ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];
const followupTypes = ["note", "call", "whatsapp", "site_visit", "quotation", "closed"];
const followupTypeLabels: Record<string, string> = {
  note: "备注",
  call: "电话",
  whatsapp: "WhatsApp",
  site_visit: "上门/测量",
  quotation: "报价",
  closed: "结案",
};

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
  const loadError = error instanceof Error ? error.message : error ? String(error) : "";
  const whatsappHref = lead ? whatsappHrefFromPhone(lead.phone) : "";
  const telHref = lead ? telHrefFromPhone(lead.phone) : "";

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    ]);
  };

  const updateLead = async (patch: Record<string, unknown>, label = "内容") => {
    if (!id) return;
    if (!canWriteLead) {
      setMessage("当前账号是只读角色，不能修改咨询内容。");
      return;
    }
    setSavingField(label);
    setMessage(`${label}保存中...`);
    try {
      const { error: updateError } = await supabase!.from("leads").update(patch).eq("id", id);
      if (updateError) {
        setMessage(`${label}保存失败：${formatAdminMutationError(updateError)}`);
        return;
      }
      setMessage(`${label}已保存。`);
      await refresh();
    } finally {
      setSavingField(null);
    }
  };

  const addFollowup = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWriteLead) {
      setMessage("当前账号是只读角色，不能新增跟进记录。");
      return;
    }
    if (!id || savingFollowup) return;
    if (!content.trim()) {
      setMessage("请先填写跟进内容。");
      return;
    }
    setSavingFollowup(true);
    setMessage("");
    try {
      const { data: userData } = await supabase!.auth.getUser();
      const { error: insertError } = await supabase!.from("lead_followups").insert({
        lead_id: id,
        followup_type: followupType,
        content: content.trim(),
        next_follow_up_at: nextFollowUpAt || null,
        created_by: userData.user?.id || null,
      });
      if (insertError) {
        setMessage(formatAdminMutationError(insertError));
        return;
      }
      if (nextFollowUpAt) {
        const { error: followUpSyncError } = await supabase!.from("leads").update({ next_follow_up_at: nextFollowUpAt }).eq("id", id);
        if (followUpSyncError) {
          setMessage(`跟进已保存，但下次跟进时间同步失败：${formatAdminMutationError(followUpSyncError)}`);
          return;
        }
      }
      setContent("");
      setNextFollowUpAt("");
      setMessage("跟进记录已保存。");
      await refresh();
    } finally {
      setSavingFollowup(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
        <AdminPageHeader
          title="咨询详情"
          description="查看客户咨询内容、更新状态、补跟进记录。"
          helpText="这里是单条咨询的处理页面。你可以在这里改状态、记备注、安排下一次跟进。"
        />
        {!canWriteLead && <AdminReadOnlyNotice />}

        {(message || loadError) && <div role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-4 text-sm">{message || loadError}</div>}
        {lead && (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold">{lead.name || "咨询"}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.phone} · {lead.email || "-"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.source_path || "-"} · {new Date(lead.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {whatsappHref ? <Button asChild variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></Button> : <Button variant="outline" disabled>WhatsApp</Button>}
                  {telHref ? <Button asChild variant="outline"><a href={telHref}>拨打电话</a></Button> : <Button variant="outline" disabled>拨打电话</Button>}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-bold">咨询详情</h2>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div><span className="text-muted-foreground">项目类型：</span> {lead.project_type || "-"}</div>
                  <div><span className="text-muted-foreground">预算：</span> {lead.budget_range || "-"}</div>
                  <div className="md:col-span-2"><span className="text-muted-foreground">留言：</span><p className="mt-1 whitespace-pre-wrap">{lead.message || "-"}</p></div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">状态</label>
                    <select
                      value={lead.status || "new"}
                      onChange={(event) => {
                        if (!canWriteLead) return;
                        const nextStatus = event.target.value;
                        setLead({ ...lead, status: nextStatus });
                        void updateLead({ status: nextStatus }, "状态");
                      }}
                      disabled={!canWriteLead || savingField === "状态"}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {translateStatusLabel("leads", item, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">下次跟进</label>
                    <Input type="datetime-local" value={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : ""} onChange={(event) => setLead({ ...lead, next_follow_up_at: event.target.value })} onBlur={() => void updateLead({ next_follow_up_at: lead.next_follow_up_at || null }, "下次跟进")} disabled={!canWriteLead || savingField === "下次跟进"} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">备注</label>
                    <Textarea rows={4} value={lead.notes || ""} onChange={(event) => setLead({ ...lead, notes: event.target.value })} onBlur={() => void updateLead({ notes: lead.notes || null }, "备注")} disabled={!canWriteLead || savingField === "备注"} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-bold">新增跟进</h2>
                <form onSubmit={addFollowup} className="space-y-3">
                  <select value={followupType} onChange={(event) => setFollowupType(event.target.value)} disabled={!canWriteLead} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {followupTypes.map((item) => <option key={item} value={item}>{followupTypeLabels[item] || item}</option>)}
                  </select>
                  <Textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="跟进记录..." disabled={!canWriteLead} />
                  <Input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} disabled={!canWriteLead} />
                  <AdminActionButton action="lead.write" type="submit" className="w-full" disabled={savingFollowup} aria-busy={savingFollowup}>
                    {savingFollowup ? "保存中..." : "保存跟进"}
                  </AdminActionButton>
                </form>
              </section>
            </div>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-xl font-bold">时间线</h2>
              <div className="space-y-3">
                {followups.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4 text-sm">
                    <p className="font-medium">{item.followup_type} · {new Date(item.created_at).toLocaleString()}</p>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                    {item.next_follow_up_at && <p className="mt-2 text-xs text-accent">下次跟进：{new Date(item.next_follow_up_at).toLocaleString()}</p>}
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
