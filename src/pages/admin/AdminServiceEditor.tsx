import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import AdminStickyActionBar from "@/components/admin/AdminStickyActionBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import ImageField from "@/components/admin/ImageField";

type ServiceRecord = {
  id?: string;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  title_zh: string;
  excerpt_zh: string;
  content_zh: string;
  image_url: string;
  alt_zh: string;
  suitable_for_zh: string[];
  common_projects_zh: string[];
  scope_items_zh: string[];
  process_steps_zh: any[];
  faqs_zh: any[];
  seo_title_zh: string;
  seo_description_zh: string;
  title_en: string;
  excerpt_en: string;
  content_en: string;
  alt_en: string;
  suitable_for_en: string[];
  common_projects_en: string[];
  scope_items_en: string[];
  process_steps_en: any[];
  faqs_en: any[];
  seo_title_en: string;
  seo_description_en: string;
};

const empty: ServiceRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  image_url: "",
  alt_zh: "",
  suitable_for_zh: [],
  common_projects_zh: [],
  scope_items_zh: [],
  process_steps_zh: [],
  faqs_zh: [],
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  alt_en: "",
  suitable_for_en: [],
  common_projects_en: [],
  scope_items_en: [],
  process_steps_en: [],
  faqs_en: [],
  seo_title_en: "",
  seo_description_en: "",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseLines = (value: string) => value.split("\n").map((s) => s.trim()).filter(Boolean);
const formatLines = (value?: string[] | null) => (value || []).join("\n");

const parseJsonArray = (value: string) => {
  const raw = value.trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};
const formatJsonArray = (value: any) => JSON.stringify(value || [], null, 2);

export default function AdminServiceEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [record, setRecord] = useState<ServiceRecord>(empty);
  const [loading, setLoading] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (isNew) {
      setRecord(empty);
      return;
    }
    if (!id) return;
    setLoading(true);
    void supabase!
      .from("services")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast({ title: "加载失败", description: error.message, variant: "destructive" });
          return;
        }
        setRecord({
          ...empty,
          ...(data as any),
          suitable_for_zh: (data as any).suitable_for_zh || [],
          suitable_for_en: (data as any).suitable_for_en || [],
          common_projects_zh: (data as any).common_projects_zh || [],
          common_projects_en: (data as any).common_projects_en || [],
          scope_items_zh: (data as any).scope_items_zh || [],
          scope_items_en: (data as any).scope_items_en || [],
          process_steps_zh: (data as any).process_steps_zh || [],
          process_steps_en: (data as any).process_steps_en || [],
          faqs_zh: (data as any).faqs_zh || [],
          faqs_en: (data as any).faqs_en || [],
        });
      });
  }, [id, isNew]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!isSupabaseConfigured) return true;
      const value = slugify(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      const { data, error } = await supabase!.from("services").select("id").eq("slug", value).limit(1);
      setSlugChecking(false);
      if (error) {
        setSlugError(error.message);
        return false;
      }
      const exists = (data || []).some((row: any) => row.id !== record.id);
      if (exists) {
        setSlugError("slug 已被占用，请更换");
        return false;
      }
      return true;
    },
    [record.id],
  );

  const previewUrl = useMemo(() => {
    const lang = "zh";
    const slug = record.slug ? slugify(record.slug) : "";
    if (!slug) return "";
    return `/${lang}/services/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: ServiceRecord["status"], generateEnglish?: boolean) => {
    if (!isSupabaseConfigured) return;
    const slug = slugify(record.slug || record.title_zh);
    if (!slug) {
      toast({ title: "请填写 slug 或中文标题", variant: "destructive" });
      return;
    }
    const ok = await checkSlugUnique(slug);
    if (!ok) {
      toast({ title: "slug 不可用", description: slugError || "请修改后再保存", variant: "destructive" });
      return;
    }

    setSaveBusy(true);
    const payload: any = {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      suitable_for_zh: record.suitable_for_zh || [],
      suitable_for_en: record.suitable_for_en || [],
      common_projects_zh: record.common_projects_zh || [],
      common_projects_en: record.common_projects_en || [],
      scope_items_zh: record.scope_items_zh || [],
      scope_items_en: record.scope_items_en || [],
      process_steps_zh: record.process_steps_zh || [],
      process_steps_en: record.process_steps_en || [],
      faqs_zh: record.faqs_zh || [],
      faqs_en: record.faqs_en || [],
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const request = record.id
      ? supabase!.from("services").update(payload).eq("id", record.id).select("id").single()
      : supabase!.from("services").insert(payload).select("id").single();

    const { data, error } = await request;
    setSaveBusy(false);
    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
      return;
    }

    const savedId = (data as any)?.id;
    setRecord((r) => ({ ...r, id: savedId, slug, status: payload.status }));
    toast({ title: "已保存" });

    if (isNew) navigate(`/admin/services/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "services", id: savedId },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已发起英文生成" });
      }
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <AdminLayout>
        <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用服务后台编辑器。" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/services">返回列表</Link>
            </Button>
            {record.status && <span className="text-xs text-muted-foreground">状态：{record.status}</span>}
            {slugChecking && <span className="text-xs text-muted-foreground">slug 检查中...</span>}
            {slugError && <span className="text-xs text-destructive">{slugError}</span>}
          </>
        }
        right={
          <>
            {previewUrl && (
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  预览
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => void save("draft")} disabled={saveBusy || loading}>
              保存草稿
            </Button>
            <Button type="button" onClick={() => void save("published")} disabled={saveBusy || loading}>
              发布
            </Button>
            <Button type="button" variant="outline" onClick={() => void save(undefined, true)} disabled={saveBusy || loading || !record.id}>
              保存并生成英文
            </Button>
          </>
        }
      />

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-6"
      >
        <AdminPageHeader
          title={isNew ? "新建服务" : "编辑服务"}
          description="中文优先编辑；英文可自动生成后再复查。保存/发布/预览统一在顶部操作栏。"
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? "隐藏英文" : "显示英文"}
            </Button>
          }
        />

        <AdminFormSection title="发布与排序" description="草稿不对外展示；发布后前台 /services 生效。">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">状态</label>
              <select
                value={record.status}
                onChange={(e) => setRecord((r) => ({ ...r, status: e.target.value as any }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">排序 sort_order</label>
              <Input
                type="number"
                value={record.sort_order}
                onChange={(e) => setRecord((r) => ({ ...r, sort_order: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="基础信息（中文）" description="用于服务列表卡片与详情页标题/摘要。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文标题 title_zh</label>
              <Input value={record.title_zh} onChange={(e) => setRecord((r) => ({ ...r, title_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="mb-1 block text-sm font-medium">Slug（链接标识）</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const next = slugify(record.slug || record.title_zh);
                      setRecord((r) => ({ ...r, slug: next }));
                      void checkSlugUnique(next);
                    }}
                  >
                    自动生成
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void checkSlugUnique(record.slug)}>
                    检查唯一
                  </Button>
                </div>
              </div>
              <Input
                value={record.slug}
                onChange={(e) => {
                  const next = e.target.value;
                  setRecord((r) => ({ ...r, slug: next }));
                  setSlugError("");
                }}
                onBlur={() => void checkSlugUnique(record.slug)}
                placeholder="例如：kitchen-renovation"
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">前台路径：{previewUrl}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文摘要 excerpt_zh</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文详情 content_zh</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="图片" description="支持粘贴 URL 或直接上传。后续会接入媒体库选择器。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="封面图 image_url"
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`services/${record.id || "draft"}`}
                usageType="hero"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
                helpText="提示：服务列表与详情页会使用该封面图。"
              />
            </div>
            {showEnglish && (
              <div>
                <label className="mb-1 block text-sm font-medium">图片 alt_en</label>
                <Input value={record.alt_en} onChange={(e) => setRecord((r) => ({ ...r, alt_en: e.target.value }))} />
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title="业务字段（中文）" description="这些字段会被前台服务详情页读取。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">适合场景 suitable_for_zh（一行一个）</label>
              <Textarea
                rows={5}
                value={formatLines(record.suitable_for_zh)}
                onChange={(e) => setRecord((r) => ({ ...r, suitable_for_zh: parseLines(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">常见项目 common_projects_zh（一行一个）</label>
              <Textarea
                rows={5}
                value={formatLines(record.common_projects_zh)}
                onChange={(e) => setRecord((r) => ({ ...r, common_projects_zh: parseLines(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">服务范围 scope_items_zh（一行一个）</label>
              <Textarea
                rows={6}
                value={formatLines(record.scope_items_zh)}
                onChange={(e) => setRecord((r) => ({ ...r, scope_items_zh: parseLines(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">服务步骤 process_steps_zh（JSON 数组）</label>
              <Textarea
                rows={7}
                value={formatJsonArray(record.process_steps_zh)}
                onChange={(e) => {
                  try {
                    setRecord((r) => ({ ...r, process_steps_zh: parseJsonArray(e.target.value) }));
                  } catch {
                    // keep raw string in UI by not updating; user can correct JSON then save
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">下一步会替换成结构化编辑器（避免手写 JSON）。</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">服务 FAQ faqs_zh（JSON 数组）</label>
              <Textarea
                rows={7}
                value={formatJsonArray(record.faqs_zh)}
                onChange={(e) => {
                  try {
                    setRecord((r) => ({ ...r, faqs_zh: parseJsonArray(e.target.value) }));
                  } catch {
                    // ignore
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">下一步会替换成结构化 FAQ 编辑器（避免手写 JSON）。</p>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="SEO（中文）" description="用于前台 meta title/description。为空时前台会 fallback。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO 标题 seo_title_zh</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO 描述 seo_description_zh</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        {showEnglish && (
          <>
            <AdminFormSection title="英文内容（可折叠）" description="英文为空时前台英文页会 fallback 中文。">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文标题 title_en</label>
                  <Input value={record.title_en} onChange={(e) => setRecord((r) => ({ ...r, title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文摘要 excerpt_en</label>
                  <Textarea rows={3} value={record.excerpt_en} onChange={(e) => setRecord((r) => ({ ...r, excerpt_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文详情 content_en</label>
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="业务字段（英文）" description="可选；为空时自动 fallback。">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">suitable_for_en（一行一个）</label>
                  <Textarea rows={5} value={formatLines(record.suitable_for_en)} onChange={(e) => setRecord((r) => ({ ...r, suitable_for_en: parseLines(e.target.value) }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">common_projects_en（一行一个）</label>
                  <Textarea rows={5} value={formatLines(record.common_projects_en)} onChange={(e) => setRecord((r) => ({ ...r, common_projects_en: parseLines(e.target.value) }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">scope_items_en（一行一个）</label>
                  <Textarea rows={6} value={formatLines(record.scope_items_en)} onChange={(e) => setRecord((r) => ({ ...r, scope_items_en: parseLines(e.target.value) }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">process_steps_en（JSON 数组）</label>
                  <Textarea
                    rows={7}
                    value={formatJsonArray(record.process_steps_en)}
                    onChange={(e) => {
                      try {
                        setRecord((r) => ({ ...r, process_steps_en: parseJsonArray(e.target.value) }));
                      } catch {
                        // ignore
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">faqs_en（JSON 数组）</label>
                  <Textarea
                    rows={7}
                    value={formatJsonArray(record.faqs_en)}
                    onChange={(e) => {
                      try {
                        setRecord((r) => ({ ...r, faqs_en: parseJsonArray(e.target.value) }));
                      } catch {
                        // ignore
                      }
                    }}
                  />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="SEO（英文）" description="可选；为空时前台 fallback。">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">seo_title_en</label>
                  <Input value={record.seo_title_en} onChange={(e) => setRecord((r) => ({ ...r, seo_title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">seo_description_en</label>
                  <Textarea rows={3} value={record.seo_description_en} onChange={(e) => setRecord((r) => ({ ...r, seo_description_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>
          </>
        )}

        <div className="pb-10" />
      </form>
    </AdminLayout>
  );
}

