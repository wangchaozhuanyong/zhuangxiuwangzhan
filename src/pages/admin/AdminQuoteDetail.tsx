import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/AdminPermission";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAdminQuote } from "@/lib/adminQueries";
import { formatAdminMutationError } from "@/lib/adminMutation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminLang } from "@/lib/adminLocale";
import { translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";

const statuses = ["pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"];
const followupTypes = ["note", "call", "whatsapp", "site_visit", "quotation", "closed"];
const followupTypeLabels: Record<string, string> = {
  note: "备注",
  call: "电话",
  whatsapp: "WhatsApp",
  site_visit: "上门/测量",
  quotation: "报价",
  closed: "结案",
};

const AdminQuoteDetail = () => {
  const lang = getAdminLang();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, error } = useAdminQuote(id);
  const [quote, setQuote] = useState<any>(null);
  const [content, setContent] = useState("");
  const [followupType, setFollowupType] = useState("note");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [message, setMessage] = useState("");
  const [savingFollowup, setSavingFollowup] = useState(false);

  useEffect(() => {
    if (data?.quote) setQuote(data.quote);
  }, [data?.quote]);

  const followups = data?.followups ?? [];
  const loadError = error instanceof Error ? error.message : error ? String(error) : "";
  const whatsappHref = quote ? whatsappHrefFromPhone(quote.customer_phone) : "";
  const telHref = quote ? telHrefFromPhone(quote.customer_phone) : "";

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    ]);
  };

  const updateQuote = async (patch: Record<string, unknown>) => {
    if (!id) return;
    setMessage("");
    const { error: updateError } = await supabase!.from("quote_requests").update(patch).eq("id", id);
    if (updateError) {
      setMessage(formatAdminMutationError(updateError));
      return;
    }
    await refresh();
  };

  const addFollowup = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || savingFollowup) return;
    if (!content.trim()) {
      setMessage("请先填写跟进内容。");
      return;
    }
    setSavingFollowup(true);
    setMessage("");
    try {
      const { data: userData } = await supabase!.auth.getUser();
      const { error } = await supabase!.from("lead_followups").insert({
        quote_request_id: id,
        followup_type: followupType,
        content: content.trim(),
        next_follow_up_at: nextFollowUpAt || null,
        created_by: userData.user?.id || null,
      });
      if (error) {
        setMessage(formatAdminMutationError(error));
        return;
      }
      if (nextFollowUpAt) {
        const { error: followUpSyncError } = await supabase!.from("quote_requests").update({ next_follow_up_at: nextFollowUpAt }).eq("id", id);
        if (followUpSyncError) {
          setMessage(`跟进已保存，但下次跟进时间同步失败：${formatAdminMutationError(followUpSyncError)}`);
          return;
        }
      }
      setContent("");
      setNextFollowUpAt("");
      await refresh();
    } finally {
      setSavingFollowup(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
        <AdminPageHeader
          title="报价详情"
          description="查看报价请求、填写报价金额、更新状态和跟进记录。"
          helpText="这里是单条报价请求的处理页面。你可以在这里填报价、安排上门、补说明。"
        />

        {(message || loadError) && <div className="rounded-xl border border-border bg-card p-4 text-sm">{message || loadError}</div>}
        {quote && (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold">{quote.customer_name || "报价请求"}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.customer_phone} · {quote.customer_email || "-"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.project_type || "-"} · {quote.source_path || "-"} · {new Date(quote.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {whatsappHref ? <Button asChild variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></Button> : <Button variant="outline" disabled>WhatsApp</Button>}
                  {telHref ? <Button asChild variant="outline"><a href={telHref}>拨打电话</a></Button> : <Button variant="outline" disabled>拨打电话</Button>}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-bold">报价详情</h2>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div><span className="text-muted-foreground">地点：</span> {quote.location || "-"}</div>
                  <div><span className="text-muted-foreground">面积/户型：</span> {quote.property_size || "-"}</div>
                  <div><span className="text-muted-foreground">预算预估：</span> {quote.estimated_budget || "-"}</div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">报价金额</label>
                    <Input type="number" value={quote.quoted_amount || ""} onChange={(event) => setQuote({ ...quote, quoted_amount: event.target.value })} onBlur={() => void updateQuote({ quoted_amount: quote.quoted_amount || null })} />
                  </div>
                  <div className="md:col-span-2"><span className="text-muted-foreground">项目详情：</span><p className="mt-1 whitespace-pre-wrap">{quote.project_details || "-"}</p></div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">状态</label>
                    <select value={quote.status || "pending"} onChange={(event) => void updateQuote({ status: event.target.value })} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {translateStatusLabel("quote_requests", item, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">有效期至</label>
                    <Input type="date" value={quote.valid_until || ""} onChange={(event) => setQuote({ ...quote, valid_until: event.target.value })} onBlur={() => void updateQuote({ valid_until: quote.valid_until || null })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">下次跟进</label>
                    <Input type="datetime-local" value={quote.next_follow_up_at ? quote.next_follow_up_at.slice(0, 16) : ""} onChange={(event) => setQuote({ ...quote, next_follow_up_at: event.target.value })} onBlur={() => void updateQuote({ next_follow_up_at: quote.next_follow_up_at || null })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">备注</label>
                    <Textarea rows={4} value={quote.notes || ""} onChange={(event) => setQuote({ ...quote, notes: event.target.value })} onBlur={() => void updateQuote({ notes: quote.notes || null })} />
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

export default AdminQuoteDetail;
