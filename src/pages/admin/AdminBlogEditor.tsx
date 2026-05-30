import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import AdminStickyActionBar from "@/components/admin/AdminStickyActionBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import ImageField from "@/components/admin/ImageField";
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminBlogPostDetail } from "@/lib/adminQueries";
import { publishStatusOptions } from "@/lib/adminLocale";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";

type BlogRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  published_at: string | null; // timestamptz

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;
  category: string;
  tags: string[];

  cover_image_url: string;
  alt_zh: string;

  seo_title_zh: string;
  seo_description_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;
  alt_en: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: BlogRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  published_at: null,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  category: "",
  tags: [],
  cover_image_url: "",
  alt_zh: "",
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  alt_en: "",
  seo_title_en: "",
  seo_description_en: "",
};

const blogEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "seo_title_en",
  "seo_description_en",
];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseLines = (value: string) => value.split("\n").map((s) => s.trim()).filter(Boolean);
const formatLines = (value?: string[] | null) => (value || []).join("\n");

// Convert timestamptz -> datetime-local value (no timezone support in input)
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export default function AdminBlogEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [showEnglish, setShowEnglish] = useState(true);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminBlogPostDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<BlogRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      tags: (loaded as any).tags || [],
      published_at: (loaded as any).published_at || null,
      sort_order: Number((loaded as any).sort_order || 0),
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<BlogRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, blogEnglishFields);
  useUnsavedChangesWarning(dirty && !saveBusy);

  useEffect(() => {
    if (!isError || !loadError) return;
    const message = loadError instanceof Error ? loadError.message : String(loadError);
    toast({ title: "加载失败", description: message, variant: "destructive" });
  }, [isError, loadError]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!isSupabaseConfigured) return true;
      const value = slugify(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      const { data, error } = await supabase!.from("blog_posts").select("id").eq("slug", value).limit(1);
      setSlugChecking(false);
      if (error) {
        setSlugError(error.message);
        return false;
      }
      const exists = (data || []).some((row: any) => row.id !== record.id);
      if (exists) {
        setSlugError("链接标识已被占用，请更换");
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
    return `/${lang}/blog/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: BlogRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
    if (!isSupabaseConfigured) return;
    const slug = slugify(record.slug || record.title_zh);
    if (!slug) {
      toast({ title: "请填写链接标识或中文标题", variant: "destructive" });
      return;
    }
    const ok = await checkSlugUnique(slug);
    if (!ok) {
      toast({ title: "链接标识不可用", description: slugError || "请修改后再保存", variant: "destructive" });
      return;
    }

    setSaveBusy(true);
    const payload: any = {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      sort_order: Number(record.sort_order || 0),
      tags: record.tags || [],
      published_at: nextStatus === "published" ? record.published_at || new Date().toISOString() : record.published_at || null,
    };

    let saved: any;
    try {
      saved = await saveAdminRecord({
        table: "blog_posts",
        payload,
        id: record.id,
        expectedUpdatedAt: record.updated_at || null,
        action: nextStatus === "published" ? "publish" : record.id ? "update" : "insert",
        queryClient,
      });
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
      setSaveBusy(false);
      return;
    }

    const savedId = saved?.id;
    applyRemote({ ...record, ...saved, id: savedId, slug, status: payload.status });
    toast({ title: "已保存" });
    await invalidateAfterAdminContentSave(queryClient);
    setSaveBusy(false);

    if (isNew) navigate(`/admin/blog/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "blog_posts", id: savedId, force: Boolean(forceEnglish) },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已自动生成英文" });
        void invalidateAdminContentDetail(queryClient, "blog_posts", savedId);
      }
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用博客后台编辑器。" />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/blog">返回列表</Link>
            </Button>
            {record.status && <span className="text-xs text-muted-foreground">状态：{record.status}</span>}
            {slugChecking && <span className="text-xs text-muted-foreground">链接标识检查中...</span>}
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
            <Button type="button" variant="outline" onClick={() => void save("draft")} disabled={saveBusy || isLoading}>
              保存草稿
            </Button>
            <Button
              type="button"
              onClick={() => {
                // If publishing without a published_at, set it to now.
                setRecord((r) => ({ ...r, published_at: r.published_at || new Date().toISOString() }));
                void save("published");
              }}
              disabled={saveBusy || isLoading}
            >
              发布
            </Button>
            <Button type="button" variant="outline" onClick={() => void save(undefined, true)} disabled={saveBusy || isLoading || !record.id}>
              保存并自动生成英文
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.confirm("这会覆盖已有英文内容，确定要重新生成吗？") && void save(undefined, true, true)}
              disabled={saveBusy || isLoading || !record.id}
            >
              强制重新生成英文
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
          title={isNew ? "新建博客文章" : "编辑博客文章"}
          description="支持草稿、发布、预览、发布时间、排序与 SEO。中文优先编辑，英文可自动生成后复查。"
          helpText="这里主要编辑博客正文、标题、封面、分类、标签和搜索优化。"
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? "隐藏英文内容" : "显示英文内容"}
            </Button>
          }
        />

        {englishMissing && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {englishMissingHint}
          </div>
        )}

        <AdminFormSection title="发布与排序" description="发布后会在前台博客页生效；发布时间用于前台排序与展示。" helpText="控制文章是否在博客列表显示，以及文章排序和发布时间。">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">状态</label>
              <select
                value={record.status}
                onChange={(e) => setRecord((r) => ({ ...r, status: e.target.value as any }))}
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
              <label className="mb-1 block text-sm font-medium">排序</label>
              <Input type="number" value={record.sort_order} onChange={(e) => setRecord((r) => ({ ...r, sort_order: Number(e.target.value || 0) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">发布时间</label>
              <Input
                type="datetime-local"
                value={toLocalInput(record.published_at)}
                onChange={(e) => setRecord((r) => ({ ...r, published_at: fromLocalInput(e.target.value) }))}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="基础信息（中文）" description="用于博客列表卡片与详情页标题/摘要。" helpText="管理中文博客标题、摘要、正文、分类和标签。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文标题</label>
              <Input value={record.title_zh} onChange={(e) => setRecord((r) => ({ ...r, title_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="mb-1 block text-sm font-medium">链接标识</label>
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
                    检查是否重复
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
                placeholder="例如：renovation-cost-kl"
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">前台路径：{previewUrl}</div>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <Input value={record.category} onChange={(e) => setRecord((r) => ({ ...r, category: e.target.value }))} placeholder="例如：指南 / 材料 / 灵感" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">标签（每行一个）</label>
              <Textarea rows={3} value={formatLines(record.tags)} onChange={(e) => setRecord((r) => ({ ...r, tags: parseLines(e.target.value) }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文摘要</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文正文</label>
              <Textarea rows={14} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="封面图" description="用于博客列表与详情页头图，支持粘贴图片链接或直接上传，后续会接入媒体库选择器。" helpText="管理博客封面图，列表卡片和详情页头图会读取这里。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="封面图"
                value={record.cover_image_url}
                onChange={(url) => setRecord((r) => ({ ...r, cover_image_url: url }))}
                folder={`blog_posts/${record.id || "draft"}`}
                usageType="blog"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
              />
            </div>
            {showEnglish && (
              <div>
                <label className="mb-1 block text-sm font-medium">英文图片说明</label>
                <Input value={record.alt_en} onChange={(e) => setRecord((r) => ({ ...r, alt_en: e.target.value }))} />
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title="SEO（中文）" description="用于前台页面标题和页面描述，留空时前台会回退到默认值。" helpText="管理中文博客文章的搜索标题和搜索描述。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文 SEO 标题</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文 SEO 描述</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        {showEnglish && (
          <>
            <AdminFormSection title="自动英文，可手动微调" description={autoEnglishDescription} helpText="英文站优先显示这里。没有英文时，后台会提示你生成英文。" collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文标题</label>
                  <Input value={record.title_en} onChange={(e) => setRecord((r) => ({ ...r, title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文摘要</label>
                  <Textarea rows={3} value={record.excerpt_en} onChange={(e) => setRecord((r) => ({ ...r, excerpt_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文正文</label>
                  <Textarea rows={14} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="英文 SEO，可手动微调" description={autoEnglishDescription} helpText="管理英文博客文章的搜索文案。正式英文 SEO 建议补齐。" collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文 SEO 标题</label>
                  <Input value={record.seo_title_en} onChange={(e) => setRecord((r) => ({ ...r, seo_title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">英文 SEO 描述</label>
                  <Textarea rows={3} value={record.seo_description_en} onChange={(e) => setRecord((r) => ({ ...r, seo_description_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>
          </>
        )}

        <div className="pb-10" />
      </form>
    </>
  );
}
