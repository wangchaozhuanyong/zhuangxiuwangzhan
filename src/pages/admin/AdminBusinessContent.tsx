import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import AdminLayout from "./AdminLayout";
import AdminProjectImages from "./AdminProjectImages";
import { AdminActionBar, AdminFilters, AdminPageShell } from "./AdminPageShell";

type ModuleKey = "services" | "projects" | "materials" | "blog_posts";
type FieldType = "text" | "textarea" | "number" | "date" | "image" | "array" | "json" | "select";
type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  group: "core" | "details" | "seo" | "english";
  options?: string[];
};

const moduleConfig: Record<ModuleKey, { title: string; route: string; table: ModuleKey; labelField: string; fields: FieldConfig[] }> = {
  services: {
    title: "服务项目 / Services",
    route: "/admin/services",
    table: "services",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "中文标题", group: "core" },
      { key: "slug", label: "Slug", group: "core" },
      { key: "excerpt_zh", label: "中文摘要", type: "textarea", group: "core" },
      { key: "content_zh", label: "中文详情", type: "textarea", group: "details" },
      { key: "image_url", label: "封面图", type: "image", group: "core" },
      { key: "suitable_for_zh", label: "适合场景（一行一个）", type: "array", group: "details" },
      { key: "common_projects_zh", label: "常见项目（一行一个）", type: "array", group: "details" },
      { key: "scope_items_zh", label: "服务范围（一行一个）", type: "array", group: "details" },
      { key: "faqs_zh", label: "FAQ JSON", type: "json", group: "details" },
      { key: "seo_title_zh", label: "中文 SEO 标题", group: "seo" },
      { key: "seo_description_zh", label: "中文 SEO 描述", type: "textarea", group: "seo" },
      { key: "title_en", label: "English Title", group: "english" },
      { key: "excerpt_en", label: "English Excerpt", type: "textarea", group: "english" },
      { key: "content_en", label: "English Content", type: "textarea", group: "english" },
      { key: "seo_title_en", label: "English SEO Title", group: "english" },
      { key: "seo_description_en", label: "English SEO Description", type: "textarea", group: "english" },
    ],
  },
  projects: {
    title: "装修案例 / Projects",
    route: "/admin/projects",
    table: "projects",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "案例标题", group: "core" },
      { key: "slug", label: "Slug", group: "core" },
      { key: "excerpt_zh", label: "案例摘要", type: "textarea", group: "core" },
      { key: "content_zh", label: "项目描述", type: "textarea", group: "details" },
      { key: "image_url", label: "封面图", type: "image", group: "core" },
      { key: "project_type", label: "项目类型", group: "details" },
      { key: "location", label: "地点", group: "details" },
      { key: "area", label: "面积", group: "details" },
      { key: "duration", label: "工期", group: "details" },
      { key: "budget", label: "预算", group: "details" },
      { key: "client_need_zh", label: "客户需求", type: "textarea", group: "details" },
      { key: "materials", label: "使用材料（一行一个）", type: "array", group: "details" },
      { key: "scope", label: "施工范围（一行一个）", type: "array", group: "details" },
      { key: "highlights_zh", label: "项目亮点（一行一个）", type: "array", group: "details" },
      { key: "seo_title_zh", label: "中文 SEO 标题", group: "seo" },
      { key: "seo_description_zh", label: "中文 SEO 描述", type: "textarea", group: "seo" },
      { key: "title_en", label: "English Title", group: "english" },
      { key: "excerpt_en", label: "English Excerpt", type: "textarea", group: "english" },
      { key: "content_en", label: "English Content", type: "textarea", group: "english" },
      { key: "seo_title_en", label: "English SEO Title", group: "english" },
      { key: "seo_description_en", label: "English SEO Description", type: "textarea", group: "english" },
    ],
  },
  materials: {
    title: "材料库 / Materials",
    route: "/admin/materials",
    table: "materials",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "材料名称", group: "core" },
      { key: "slug", label: "Slug", group: "core" },
      { key: "excerpt_zh", label: "材料摘要", type: "textarea", group: "core" },
      { key: "image_url", label: "图片", type: "image", group: "core" },
      { key: "category", label: "分类", group: "details" },
      { key: "subcategory", label: "子分类", group: "details" },
      { key: "material_type", label: "材料类型", group: "details" },
      { key: "color", label: "颜色", group: "details" },
      { key: "texture", label: "纹理", group: "details" },
      { key: "reference_price", label: "参考价格", group: "details" },
      { key: "suitable_spaces_zh", label: "适用空间（一行一个）", type: "array", group: "details" },
      { key: "pros_zh", label: "优点（一行一个）", type: "array", group: "details" },
      { key: "cons_zh", label: "缺点（一行一个）", type: "array", group: "details" },
      { key: "recommended_pairing_zh", label: "推荐搭配（一行一个）", type: "array", group: "details" },
      { key: "note_zh", label: "备注", type: "textarea", group: "details" },
      { key: "seo_title_zh", label: "中文 SEO 标题", group: "seo" },
      { key: "seo_description_zh", label: "中文 SEO 描述", type: "textarea", group: "seo" },
      { key: "title_en", label: "English Title", group: "english" },
      { key: "excerpt_en", label: "English Excerpt", type: "textarea", group: "english" },
      { key: "seo_title_en", label: "English SEO Title", group: "english" },
      { key: "seo_description_en", label: "English SEO Description", type: "textarea", group: "english" },
    ],
  },
  blog_posts: {
    title: "博客文章 / Blog",
    route: "/admin/blog",
    table: "blog_posts",
    labelField: "title_zh",
    fields: [
      { key: "title_zh", label: "标题", group: "core" },
      { key: "slug", label: "Slug", group: "core" },
      { key: "category", label: "分类", group: "core" },
      { key: "tags", label: "标签（一行一个）", type: "array", group: "core" },
      { key: "cover_image_url", label: "封面图", type: "image", group: "core" },
      { key: "excerpt_zh", label: "摘要", type: "textarea", group: "core" },
      { key: "content_zh", label: "正文", type: "textarea", group: "details" },
      { key: "published_at", label: "发布时间", type: "date", group: "details" },
      { key: "seo_title_zh", label: "中文 SEO 标题", group: "seo" },
      { key: "seo_description_zh", label: "中文 SEO 描述", type: "textarea", group: "seo" },
      { key: "title_en", label: "English Title", group: "english" },
      { key: "excerpt_en", label: "English Excerpt", type: "textarea", group: "english" },
      { key: "content_en", label: "English Content", type: "textarea", group: "english" },
      { key: "seo_title_en", label: "English SEO Title", group: "english" },
      { key: "seo_description_en", label: "English SEO Description", type: "textarea", group: "english" },
    ],
  },
};

const statusOptions = ["draft", "published", "archived"];
const arrayFields = new Set(["tags", "materials", "scope", "suitable_for_zh", "common_projects_zh", "scope_items_zh", "highlights_zh", "suitable_spaces_zh", "pros_zh", "cons_zh", "recommended_pairing_zh"]);
const jsonFields = new Set(["faqs_zh"]);

const emptyRecord = { status: "draft", sort_order: 0 };

const normalizeValue = (field: FieldConfig, value: unknown) => {
  if (arrayFields.has(field.key)) {
    if (Array.isArray(value)) return value.join("\n");
    return String(value || "");
  }
  if (jsonFields.has(field.key)) return typeof value === "string" ? value : JSON.stringify(value || [], null, 2);
  return String(value ?? "");
};

const parseValue = (field: FieldConfig, value: unknown) => {
  if (arrayFields.has(field.key)) return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
  if (jsonFields.has(field.key)) {
    try {
      return String(value || "").trim() ? JSON.parse(String(value)) : [];
    } catch {
      return value;
    }
  }
  if (field.type === "number") return Number(value || 0);
  return value || null;
};

export const AdminBusinessList = ({ module }: { module: ModuleKey }) => {
  const config = moduleConfig[module];
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from(config.table).select("*").order("created_at", { ascending: false }).limit(200);
    if (error) setMessage(error.message);
    else setRows(data || []);
  }, [config.table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const haystack = [row.title_zh, row.title_en, row.slug, row.category, row.location].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [rows, search, status]);

  return (
    <AdminLayout>
      <AdminPageShell
        title={config.title}
        actions={<Button asChild><Link to={`${config.route}/new`}>新建 / New</Link></Button>}
      >
        <div className="space-y-4">
          <AdminFilters>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题、slug、分类..." />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">全部状态 / All</option>
              {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </AdminFilters>
          {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

          <div className="space-y-3">
            {filtered.map((row) => (
              <Link key={row.id} to={`${config.route}/${row.id}`} className="block rounded-xl border border-border bg-card p-4 hover:bg-muted">
                <p className="font-semibold">{row[config.labelField] || row.title_en || row.slug || row.id}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.slug || "-"} · {row.status || "-"} · {new Date(row.created_at).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export const AdminBusinessEditor = ({ module }: { module: ModuleKey }) => {
  const { id } = useParams<{ id: string }>();
  const config = moduleConfig[module];
  const isNew = id === "new";
  const [record, setRecord] = useState<Record<string, any>>(emptyRecord);
  const [activeLang, setActiveLang] = useState<"zh" | "en">("zh");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!id || isNew || !isSupabaseConfigured) {
      setRecord(emptyRecord);
      return;
    }
    void supabase!.from(config.table).select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) setStatus(error.message);
      else setRecord(data || emptyRecord);
    });
  }, [config.table, id, isNew]);

  const update = (key: string, value: unknown) => setRecord((current) => ({ ...current, [key]: value }));

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
    setStatus("Copied ZH → EN.");
  };

  const save = async (generateEnglish = false) => {
    const payload: Record<string, unknown> = { ...record };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    for (const field of config.fields) payload[field.key] = parseValue(field, payload[field.key]);

    const request = record.id
      ? supabase!.from(config.table).update(payload).eq("id", record.id).select("id").single()
      : supabase!.from(config.table).insert(payload).select("id").single();

    const { data, error } = await request;
    if (error) {
      setStatus(error.message);
      return;
    }
    const savedId = data.id;
    setRecord((current) => ({ ...current, id: savedId }));
    setStatus("Saved.");
    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: config.table, id: savedId },
      });
      setStatus(translationError ? `Saved, translation failed: ${translationError.message}` : "Saved and translation requested.");
    }
    if (isNew) window.history.replaceState(null, "", `${config.route}/${savedId}`);
  };

  const renderField = (field: FieldConfig) => {
    const value = normalizeValue(field, record[field.key]);
    const common = { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field.key, event.target.value) };

    return (
      <div key={field.key} className={field.type === "textarea" || field.type === "json" || field.type === "array" ? "md:col-span-2" : ""}>
        <label className="mb-1 block text-sm font-medium">{field.label}</label>
        {field.type === "textarea" || field.type === "json" || field.type === "array" ? (
          <Textarea rows={field.type === "json" ? 6 : 4} {...common} />
        ) : field.type === "image" ? (
          <div className="space-y-3">
            <Input {...common} />
            <AdminImageUpload value={value} folder={`${module}/${record.id || "draft"}`} onUploaded={(url) => update(field.key, url)} />
          </div>
        ) : field.type === "date" ? (
          <Input type="datetime-local" {...common} />
        ) : (
          <Input {...common} />
        )}
      </div>
    );
  };

  const renderGroup = (group: FieldConfig["group"], title: string) => {
    const groupFields = config.fields.filter((field) => field.group === group);
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
        <div className="grid gap-4 md:grid-cols-2">{groupFields.map(renderField)}</div>
      </section>
    );
  };

  return (
    <AdminLayout>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); void save(false); }} className="min-w-0 space-y-6">
        <AdminPageShell
          title={config.title}
          description="使用固定操作条与分组表单，移动端自动换行，避免按钮与字段重叠。"
          headerRight={
            <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "zh" | "en")}>
              <TabsList>
                <TabsTrigger value="zh">中文</TabsTrigger>
                <TabsTrigger value="en">英文</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <AdminActionBar
            left={
              <div className="flex min-w-0 flex-col">
                <div className="truncate text-sm font-semibold">{record.title_zh || record.title_en || record.slug || (isNew ? "New" : record.id)}</div>
                <div className="truncate text-xs text-muted-foreground">{status || (isNew ? "Draft" : "")}</div>
              </div>
            }
            right={
              <>
                <Button type="button" variant="outline" onClick={copyZhToEn}>中文复制到英文</Button>
                <Button type="button" variant="outline" onClick={() => void save(true)}>保存并生成英文</Button>
                <Button type="submit">保存</Button>
              </>
            }
          />

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">发布设置</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">状态</label>
              <select value={record.status || "draft"} onChange={(event) => update("status", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">排序</label>
              <Input type="number" value={record.sort_order || 0} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
            </div>
          </div>
        </section>

          <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "zh" | "en")}>
            <TabsContent value="zh" className="mt-0 space-y-6">
              {renderGroup("core", "核心内容")}
              {renderGroup("details", "业务详情")}
              {module === "projects" ? <AdminProjectImages projectId={record.id} /> : null}
              {renderGroup("seo", "SEO")}
            </TabsContent>
            <TabsContent value="en" className="mt-0 space-y-6">
              {renderGroup("english", "英文内容 / English")}
            </TabsContent>
          </Tabs>
        </AdminPageShell>
      </form>
    </AdminLayout>
  );
};
