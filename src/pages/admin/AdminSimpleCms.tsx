import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidatePublishedContent } from "@/lib/adminInvalidate";
import { useAdminSimpleCmsRows } from "@/lib/adminQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import { adminStatusLabel, publishStatusOptions } from "@/lib/adminLocale";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { getAdminFieldHelp, getAdminTableHelp } from "@/lib/adminHelpText";

type ModuleKey = "site_pages" | "home_sections" | "faqs" | "before_after_items" | "brand_partners";
type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "number" | "select" | "textList" };

const configs: Record<ModuleKey, { title: string; table: ModuleKey; labelField: string; fields: Field[] }> = {
  site_pages: {
    title: "页面内容",
    table: "site_pages",
    labelField: "page_key",
    fields: [
      { key: "page_key", label: "页面标识" },
      { key: "path", label: "前台路径" },
      { key: "title_zh", label: "中文页面/首页标题" },
      { key: "title_en", label: "英文页面/首页标题" },
      { key: "subtitle_zh", label: "中文首页副标题" },
      { key: "subtitle_en", label: "英文首页副标题" },
      { key: "description_zh", label: "中文首页/页面说明", type: "textarea" },
      { key: "description_en", label: "英文首页/页面说明", type: "textarea" },
      { key: "content_zh", label: "中文正文/补充说明", type: "textarea" },
      { key: "content_en", label: "英文正文/补充说明", type: "textarea" },
      { key: "cta_title_zh", label: "中文行动引导标题" },
      { key: "cta_title_en", label: "英文行动引导标题" },
      { key: "cta_description_zh", label: "中文行动引导说明", type: "textarea" },
      { key: "cta_description_en", label: "英文行动引导说明", type: "textarea" },
      { key: "image_url", label: "页面图片（首页首屏视频不使用）", type: "image" },
      { key: "alt_zh", label: "中文图片说明" },
      { key: "alt_en", label: "英文图片说明" },
      { key: "seo_title_zh", label: "中文 SEO 标题" },
      { key: "seo_title_en", label: "英文 SEO 标题" },
      { key: "seo_description_zh", label: "中文 SEO 描述", type: "textarea" },
      { key: "seo_description_en", label: "英文 SEO 描述", type: "textarea" },
      { key: "seo_keywords_zh", label: "中文 SEO 关键词" },
      { key: "seo_keywords_en", label: "英文 SEO 关键词" },
      { key: "items_zh", label: "中文扩展列表", type: "textList" },
      { key: "items_en", label: "英文扩展列表", type: "textList" },
    ],
  },
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
      { key: "button_url", label: "按钮链接" },
    ],
  },
  faqs: {
    title: "常见问题",
    table: "faqs",
    labelField: "question_zh",
    fields: [
      { key: "page_key", label: "页面标识" },
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
      { key: "alt_zh", label: "中文图片说明" },
      { key: "alt_en", label: "英文图片说明" },
    ],
  },
  brand_partners: {
    title: "品牌合作",
    table: "brand_partners",
    labelField: "name",
    fields: [
      { key: "name", label: "名称" },
      { key: "logo_url", label: "品牌图标", type: "image" },
      { key: "website_url", label: "官网链接" },
    ],
  },
};

const emptyRecord = { status: "published", sort_order: 0 };

const formatAdminError = (module: ModuleKey, error: unknown) => {
  const record = error as { code?: string; message?: string; hint?: string; details?: string };
  const message = record?.message || (error instanceof Error ? error.message : String(error));
  if (module === "site_pages" && (record?.code === "PGRST205" || message.includes("site_pages"))) {
    return "数据库里还没有 `site_pages` 表，页面内容暂时不能保存。请先执行迁移 `supabase/migrations/202605290004_site_pages.sql`。";
  }
  return [message, record?.hint, record?.details].filter(Boolean).join(" ");
};

const AdminSimpleCms = ({ module }: { module: ModuleKey }) => {
  const config = configs[module];
  const queryClient = useQueryClient();
  const { data: rows = [], error, refetch } = useAdminSimpleCmsRows(config.table);
  const [record, setRecord] = useState<Record<string, any>>(emptyRecord);
  const recordDirtyRef = useRef(false);
  const [message, setMessage] = useState(error instanceof Error ? error.message : error ? String(error) : "");

  useEffect(() => {
    if (error) setMessage(formatAdminError(module, error));
  }, [error, module]);

  const title = useMemo(() => record[config.labelField] || record.title_en || record.name || "新建", [config.labelField, record]);

  const update = (key: string, value: unknown) => {
    recordDirtyRef.current = true;
    setRecord((current) => ({ ...current, [key]: value }));
  };

  const loadRecord = (row: Record<string, any>) => {
    recordDirtyRef.current = false;
    setRecord(row);
  };

  const resetRecord = () => {
    recordDirtyRef.current = false;
    setRecord(emptyRecord);
  };

  const save = async () => {
    if (!isSupabaseConfigured) return;
    const payload = { ...record };
    for (const field of config.fields) {
      if (field.type === "textList") {
        const value = payload[field.key];
        payload[field.key] = Array.isArray(value)
          ? value.map((item) => String(item || "").trim()).filter(Boolean)
          : String(value || "")
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);
      }
    }
    const recordId = payload.id;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const request = recordId
      ? supabase!.from(config.table).update(payload).eq("id", recordId).select("*").single()
      : supabase!.from(config.table).insert(payload).select("*").single();

    const { data, error } = await request;
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("已保存。");
    recordDirtyRef.current = false;
    setRecord((data as Record<string, any>) || emptyRecord);
    void invalidatePublishedContent(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["admin", config.table, "rows"] });
    await refetch();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase!.from(config.table).delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("已删除。");
      void invalidatePublishedContent(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["admin", config.table, "rows"] });
      await refetch();
    }
  };

  const renderField = (field: Field) => {
    const rawValue = record[field.key];
    const value = String(rawValue || "");
    if (field.type === "textList") {
      const listValue = Array.isArray(rawValue)
        ? rawValue.map((item) => String(item || ""))
        : String(rawValue || "")
            .split("\n")
            .filter(Boolean);
      return (
        <div key={field.key} className="md:col-span-2">
          <TextListEditor
            label={field.label}
            helpText={getAdminFieldHelp(field.key)}
            value={listValue}
            onChange={(nextValue) => update(field.key, nextValue)}
            placeholder="填写一条前台会显示的列表内容"
            addLabel="添加一条"
          />
          <p className="mt-1 text-xs text-muted-foreground">{getAdminFieldHelp(field.key)}</p>
        </div>
      );
    }

    return (
      <div key={field.key} className={field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}>
        <AdminFieldLabel label={field.label} help={getAdminFieldHelp(field.key)} />
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
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">{config.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{getAdminTableHelp(config.table)}</p>
            {message && <p className="mt-2 rounded-lg bg-muted p-3 text-sm">{message}</p>}
          </div>
          <Button type="button" variant="outline" onClick={resetRecord}>
            新建
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{row[config.labelField] || row.title_en || row.name || row.id}</p>
                <p className="text-xs text-muted-foreground">状态：{adminStatusLabel("default", row.status || "-")} | 排序 {row.sort_order || 0}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => loadRecord(row)}>
                  编辑
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => void remove(row.id)}>
                  删除
                </Button>
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
            <AdminFieldLabel label="状态" help={getAdminFieldHelp("status")} />
            <select
              value={record.status || "published"}
              onChange={(event) => update("status", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {publishStatusOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <AdminFieldLabel label="排序" help={getAdminFieldHelp("sort_order")} />
            <Input type="number" value={record.sort_order || 0} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
          </div>
        </div>
        <Button type="button" className="mt-5 w-full" onClick={() => void save()}>
          保存
        </Button>
      </section>
    </div>
  );
};

export default AdminSimpleCms;
