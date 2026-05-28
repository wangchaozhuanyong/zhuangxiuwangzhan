import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import AdminLayout from "./AdminLayout";
import { AdminActionBar, AdminPageShell } from "./AdminPageShell";

type ModuleKey = "home_sections" | "faqs" | "before_after_items" | "brand_partners";
type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "number" | "select" };

const configs: Record<ModuleKey, { title: string; table: ModuleKey; labelField: string; fields: Field[] }> = {
  home_sections: {
    title: "首页模块 / Home Sections",
    table: "home_sections",
    labelField: "section_key",
    fields: [
      { key: "section_key", label: "Section Key" },
      { key: "title_zh", label: "中文标题" },
      { key: "title_en", label: "English Title" },
      { key: "subtitle_zh", label: "中文副标题", type: "textarea" },
      { key: "subtitle_en", label: "English Subtitle", type: "textarea" },
      { key: "content_zh", label: "中文内容", type: "textarea" },
      { key: "content_en", label: "English Content", type: "textarea" },
      { key: "image_url", label: "图片", type: "image" },
      { key: "button_label_zh", label: "中文按钮" },
      { key: "button_label_en", label: "English Button" },
      { key: "button_url", label: "Button URL" },
    ],
  },
  faqs: {
    title: "常见问题 / FAQs",
    table: "faqs",
    labelField: "question_zh",
    fields: [
      { key: "page_key", label: "Page Key" },
      { key: "question_zh", label: "中文问题", type: "textarea" },
      { key: "question_en", label: "English Question", type: "textarea" },
      { key: "answer_zh", label: "中文答案", type: "textarea" },
      { key: "answer_en", label: "English Answer", type: "textarea" },
    ],
  },
  before_after_items: {
    title: "前后对比 / Before & After",
    table: "before_after_items",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "中文标题" },
      { key: "title_en", label: "English Title" },
      { key: "location", label: "Location" },
      { key: "description_zh", label: "中文描述", type: "textarea" },
      { key: "description_en", label: "English Description", type: "textarea" },
      { key: "before_image_url", label: "Before Image", type: "image" },
      { key: "after_image_url", label: "After Image", type: "image" },
      { key: "alt_zh", label: "中文 Alt" },
      { key: "alt_en", label: "English Alt" },
    ],
  },
  brand_partners: {
    title: "品牌合作 / Brand Partners",
    table: "brand_partners",
    labelField: "name",
    fields: [
      { key: "name", label: "Name" },
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "website_url", label: "Website URL" },
    ],
  },
};

const emptyRecord = { status: "published", sort_order: 0 };

const AdminSimpleCms = ({ module }: { module: ModuleKey }) => {
  const config = configs[module];
  const [rows, setRows] = useState<any[]>([]);
  const [record, setRecord] = useState<Record<string, any>>(emptyRecord);
  const [message, setMessage] = useState("");
  const [activeLang, setActiveLang] = useState<"zh" | "en">("zh");

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from(config.table).select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setRows(data || []);
  }, [config.table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const title = useMemo(() => record[config.labelField] || record.title_en || record.name || "New", [config.labelField, record]);
  const update = (key: string, value: unknown) => setRecord((current) => ({ ...current, [key]: value }));
  const isEditing = Boolean(record.id) || record !== emptyRecord;

  const save = async () => {
    if (!isSupabaseConfigured) return;
    const payload = { ...record };
    delete payload.created_at;
    delete payload.updated_at;
    const request = payload.id
      ? supabase!.from(config.table).update(payload).eq("id", payload.id)
      : supabase!.from(config.table).insert(payload);
    const { error } = await request;
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Saved.");
    setRecord(emptyRecord);
    await loadRows();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase!.from(config.table).delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Deleted.");
      await loadRows();
    }
  };

  const renderField = (field: Field) => {
    const value = String(record[field.key] || "");
    return (
      <div key={field.key} className={field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}>
        <label className="mb-1 block text-sm font-medium">{field.label}</label>
        {field.type === "textarea" ? (
          <Textarea rows={4} value={value} onChange={(event) => update(field.key, event.target.value)} />
        ) : field.type === "image" ? (
          <div className="space-y-3">
            <Input value={value} onChange={(event) => update(field.key, event.target.value)} />
            <AdminImageUpload folder={config.table} value={value} onUploaded={(url) => update(field.key, url)} />
          </div>
        ) : (
          <Input value={value} onChange={(event) => update(field.key, event.target.value)} />
        )}
      </div>
    );
  };

  const copyZhToEn = () => {
    const updates: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (!field.key.endsWith("_zh")) continue;
      const enKey = field.key.replace(/_zh$/, "_en");
      const hasEnField = config.fields.some((f) => f.key === enKey);
      if (!hasEnField) continue;
      updates[enKey] = record[field.key] ?? "";
    }
    setRecord((current) => ({ ...current, ...updates }));
    setMessage("Copied ZH → EN.");
  };

  const visibleFields = (langKey: "zh" | "en") =>
    config.fields.filter((field) => {
      if (field.key.endsWith("_zh")) return langKey === "zh";
      if (field.key.endsWith("_en")) return langKey === "en";
      return true;
    });

  return (
    <AdminLayout>
      <AdminPageShell
        title={config.title}
        description="列表与编辑分区，移动端自动上下排列，避免控件挤压重叠。"
        actions={<Button type="button" variant="outline" onClick={() => setRecord(emptyRecord)}>新建 / New</Button>}
      >
        <AdminActionBar
          left={<div className="truncate text-sm text-muted-foreground">正在编辑：<span className="font-medium text-foreground">{title}</span></div>}
          right={
            <>
              <Button type="button" variant="outline" onClick={copyZhToEn}>中文复制到英文</Button>
              <Button type="button" onClick={() => void save()}>保存 / Save</Button>
            </>
          }
        />

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0 rounded-xl border border-border bg-card p-4 md:p-6">
            {message && <p className="mb-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row[config.labelField] || row.title_en || row.name || row.id}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.status || "-"} · sort {row.sort_order || 0}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRecord(row)}>编辑</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void remove(row.id)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 truncate font-display text-xl font-bold">{title}</h2>
              <div className="shrink-0">
                <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "zh" | "en")}>
                  <TabsList>
                    <TabsTrigger value="zh">中文</TabsTrigger>
                    <TabsTrigger value="en">英文</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "zh" | "en")}>
              <TabsContent value="zh" className="mt-0">
                <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-1">
                  {visibleFields("zh").map(renderField)}
                </div>
              </TabsContent>
              <TabsContent value="en" className="mt-0">
                <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-1">
                  {visibleFields("en").map(renderField)}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select value={record.status || "published"} onChange={(event) => update("status", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Sort Order</label>
                <Input type="number" value={record.sort_order || 0} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
              </div>
            </div>
          </section>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminSimpleCms;
