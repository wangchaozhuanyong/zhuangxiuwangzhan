import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import AdminLayout from "./AdminLayout";

type ModuleKey = "home_sections" | "faqs" | "before_after_items" | "brand_partners";
type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "number" | "select" };

const configs: Record<ModuleKey, { title: string; table: ModuleKey; labelField: string; fields: Field[] }> = {
  home_sections: {
    title: "首页模块",
    table: "home_sections",
    labelField: "section_key",
    fields: [
      { key: "section_key", label: "模块标识（section_key）" },
      { key: "title_zh", label: "中文标题" },
      { key: "title_en", label: "英文标题" },
      { key: "subtitle_zh", label: "中文副标题", type: "textarea" },
      { key: "subtitle_en", label: "英文副标题", type: "textarea" },
      { key: "content_zh", label: "中文内容", type: "textarea" },
      { key: "content_en", label: "英文内容", type: "textarea" },
      { key: "image_url", label: "图片", type: "image" },
      { key: "button_label_zh", label: "中文按钮" },
      { key: "button_label_en", label: "英文按钮" },
      { key: "button_url", label: "按钮链接（URL）" },
    ],
  },
  faqs: {
    title: "常见问题",
    table: "faqs",
    labelField: "question_zh",
    fields: [
      { key: "page_key", label: "页面标识（page_key）" },
      { key: "question_zh", label: "中文问题", type: "textarea" },
      { key: "question_en", label: "英文问题", type: "textarea" },
      { key: "answer_zh", label: "中文答案", type: "textarea" },
      { key: "answer_en", label: "英文答案", type: "textarea" },
    ],
  },
  before_after_items: {
    title: "改造前后",
    table: "before_after_items",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "中文标题" },
      { key: "title_en", label: "英文标题" },
      { key: "location", label: "地点" },
      { key: "description_zh", label: "中文描述", type: "textarea" },
      { key: "description_en", label: "英文描述", type: "textarea" },
      { key: "before_image_url", label: "改造前图片", type: "image" },
      { key: "after_image_url", label: "改造后图片", type: "image" },
      { key: "alt_zh", label: "中文 Alt 文本", },
      { key: "alt_en", label: "英文 Alt 文本", },
    ],
  },
  brand_partners: {
    title: "品牌合作",
    table: "brand_partners",
    labelField: "name",
    fields: [
      { key: "name", label: "名称" },
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "website_url", label: "官网链接（URL）" },
    ],
  },
};

const emptyRecord = { status: "published", sort_order: 0 };

const AdminSimpleCms = ({ module }: { module: ModuleKey }) => {
  const config = configs[module];
  const [rows, setRows] = useState<any[]>([]);
  const [record, setRecord] = useState<Record<string, any>>(emptyRecord);
  const [message, setMessage] = useState("");

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from(config.table).select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setRows(data || []);
  }, [config.table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const title = useMemo(() => record[config.labelField] || record.title_en || record.name || "新建", [config.labelField, record]);
  const update = (key: string, value: unknown) => setRecord((current) => ({ ...current, [key]: value }));

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
    setMessage("已保存。");
    setRecord(emptyRecord);
    await loadRows();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase!.from(config.table).delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("已删除。");
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

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">{config.title}</h1>
              {message && <p className="mt-2 rounded-lg bg-muted p-3 text-sm">{message}</p>}
            </div>
            <Button type="button" variant="outline" onClick={() => setRecord(emptyRecord)}>新建</Button>
          </div>
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{row[config.labelField] || row.title_en || row.name || row.id}</p>
                  <p className="text-xs text-muted-foreground">{row.status || "-"} · 排序 {row.sort_order || 0}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setRecord(row)}>编辑</Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => void remove(row.id)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {config.fields.map(renderField)}
            <div>
              <label className="mb-1 block text-sm font-medium">状态</label>
              <select value={record.status || "published"} onChange={(event) => update("status", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="published">published</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">排序</label>
              <Input type="number" value={record.sort_order || 0} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
            </div>
          </div>
          <Button type="button" className="mt-5 w-full" onClick={() => void save()}>保存</Button>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSimpleCms;
