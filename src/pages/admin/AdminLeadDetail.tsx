import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAdminLead } from "@/lib/adminQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminLang } from "@/lib/adminLocale";
import { translateStatusLabel } from "@/i18n/displayLabels";

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

  useEffect(() => {
    if (data?.lead) setLead(data.lead);
  }, [data?.lead]);

  const followups = data?.followups ?? [];
  const loadError = error instanceof Error ? error.message : error ? String(error) : "";

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "leads", id] });

  const updateLead = async (patch: Record<string, unknown>) => {
    if (!id) return;
    const { error: updateError } = await supabase!.from("leads").update(patch).eq("id", id);
    if (updateError) setMessage(updateError.message);
    else await refresh();
  };

  const addFollowup = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !content.trim()) return;
    const { data: userData } = await supabase!.auth.getUser();
    const { error: insertError } = await supabase!.from("lead_followups").insert({
      lead_id: id,
      followup_type: followupType,
      content,
      next_follow_up_at: nextFollowUpAt || null,
      created_by: userData.user?.id || null,
    });
    if (insertError) {
      setMessage(insertError.message);
      return;
    }
    setContent("");
    setNextFollowUpAt("");
    await refresh();
  };

  return (
    <>
    <div className="space-y-6">
        <AdminPageHeader
          title="咨询详情"
          description="查看客户咨询内容、更新状态、补跟进记录。"
          helpText="这里是单条咨询的处理页面。你可以在这里改状态、记备注、安排下一次跟进。"
        />

        {(message || loadError) && <div className="rounded-xl border border-border bg-card p-4 text-sm">{message || loadError}</div>}
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
                  <Button asChild variant="outline"><a href={`https://wa.me/${String(lead.phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></Button>
                  <Button asChild variant="outline"><a href={`tel:${String(lead.phone || "").replace(/[^\d+]/g, "")}`}>拨打电话</a></Button>
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
                    <select value={lead.status || "new"} onChange={(event) => void updateLead({ status: event.target.value })} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {translateStatusLabel("leads", item, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">下次跟进</label>
                    <Input type="datetime-local" value={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : ""} onChange={(event) => setLead({ ...lead, next_follow_up_at: event.target.value })} onBlur={() => void updateLead({ next_follow_up_at: lead.next_follow_up_at || null })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">备注</label>
                    <Textarea rows={4} value={lead.notes || ""} onChange={(event) => setLead({ ...lead, notes: event.target.value })} onBlur={() => void updateLead({ notes: lead.notes || null })} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-bold">新增跟进</h2>
                <form onSubmit={addFollowup} className="space-y-3">
                  <select value={followupType} onChange={(event) => setFollowupType(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {followupTypes.map((item) => <option key={item} value={item}>{followupTypeLabels[item] || item}</option>)}
                  </select>
                  <Textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="跟进记录..." />
                  <Input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} />
                  <Button type="submit" className="w-full">保存跟进</Button>
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
