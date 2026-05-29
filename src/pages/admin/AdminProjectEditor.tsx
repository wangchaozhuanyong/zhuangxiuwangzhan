import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFormState } from "@/hooks/useAdminFormState";
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
import { useAdminProjectDetail } from "@/lib/adminQueries";
import { publishStatusOptions } from "@/lib/adminLocale";
import AdminProjectImages from "./AdminProjectImages";

type ProjectRecord = {
  id?: string;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;

  project_type: string;
  location: string;
  area: string;
  duration: string;
  budget: string;
  client_need_zh: string;
  client_need_en: string;
  materials: string[];
  scope: string[];
  highlights_zh: string[];
  highlights_en: string[];

  image_url: string; // legacy fallback only; actual cover is project_images(type='cover')

  seo_title_zh: string;
  seo_description_zh: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: ProjectRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  project_type: "",
  location: "",
  area: "",
  duration: "",
  budget: "",
  client_need_zh: "",
  client_need_en: "",
  materials: [],
  scope: [],
  highlights_zh: [],
  highlights_en: [],
  image_url: "",
  seo_title_zh: "",
  seo_description_zh: "",
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

export default function AdminProjectEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [showEnglish, setShowEnglish] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminProjectDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<ProjectRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      materials: (loaded as any).materials || [],
      scope: (loaded as any).scope || [],
      highlights_zh: (loaded as any).highlights_zh || [],
      highlights_en: (loaded as any).highlights_en || [],
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote } = useAdminFormState<ProjectRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });

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
      const { data, error } = await supabase!.from("projects").select("id").eq("slug", value).limit(1);
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
    return `/${lang}/projects/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: ProjectRecord["status"], generateEnglish?: boolean) => {
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
      sort_order: Number(record.sort_order || 0),
      materials: record.materials || [],
      scope: record.scope || [],
      highlights_zh: record.highlights_zh || [],
      highlights_en: record.highlights_en || [],
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const request = record.id
      ? supabase!.from("projects").update(payload).eq("id", record.id).select("id").single()
      : supabase!.from("projects").insert(payload).select("id").single();

    const { data, error } = await request;
    setSaveBusy(false);
    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
      return;
    }

    const savedId = (data as any)?.id;
    applyRemote({ ...record, id: savedId, slug, status: payload.status });
    toast({ title: "已保存" });
    void invalidateAfterAdminContentSave(queryClient);

    if (isNew) navigate(`/admin/projects/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "projects", id: savedId },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已发起英文生成" });
        void invalidateAdminContentDetail(queryClient, "projects", savedId);
      }
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用案例后台编辑器。" />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/projects">返回列表</Link>
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
            <Button type="button" onClick={() => void save("published")} disabled={saveBusy || isLoading}>
              发布
            </Button>
            <Button type="button" variant="outline" onClick={() => void save(undefined, true)} disabled={saveBusy || isLoading || !record.id}>
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
          title={isNew ? "新建案例" : "编辑案例"}
          description="封面 / 图库 / Before-After 请在“项目图片”模块里管理，前台缩略图优先使用 cover。"
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? "隐藏英文" : "显示英文"}
            </Button>
          }
        />

        <AdminFormSection title="发布与排序" description="草稿不对外展示；发布后前台 /projects 生效。" helpText="控制案例是否在前台显示，以及它在案例列表里的排序。">
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
              <label className="mb-1 block text-sm font-medium">排序 sort_order</label>
              <Input type="number" value={record.sort_order} onChange={(e) => setRecord((r) => ({ ...r, sort_order: Number(e.target.value || 0) }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="基础信息（中文）" description="用于案例列表卡片与详情页标题/摘要。" helpText="管理案例中文标题、摘要、正文和基础展示信息。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">案例标题 title_zh</label>
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
                placeholder="例如：condo-renovation-kl"
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">前台路径：{previewUrl}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">案例摘要 excerpt_zh</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">项目描述 content_zh</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="项目资料（中文）" description="用于详情页的项目资料展示。" helpText="管理项目地点、面积、周期、预算、类型、材料、范围和亮点。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">项目类型 project_type</label>
              <Input value={record.project_type} onChange={(e) => setRecord((r) => ({ ...r, project_type: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">地区 location</label>
              <Input value={record.location} onChange={(e) => setRecord((r) => ({ ...r, location: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">面积 area</label>
              <Input value={record.area} onChange={(e) => setRecord((r) => ({ ...r, area: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">工期 duration</label>
              <Input value={record.duration} onChange={(e) => setRecord((r) => ({ ...r, duration: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">预算 budget</label>
              <Input value={record.budget} onChange={(e) => setRecord((r) => ({ ...r, budget: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">客户需求 client_need_zh</label>
              <Textarea rows={4} value={record.client_need_zh} onChange={(e) => setRecord((r) => ({ ...r, client_need_zh: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">使用材料 materials（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.materials)} onChange={(e) => setRecord((r) => ({ ...r, materials: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">施工范围 scope（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.scope)} onChange={(e) => setRecord((r) => ({ ...r, scope: parseLines(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">项目亮点 highlights_zh（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.highlights_zh)} onChange={(e) => setRecord((r) => ({ ...r, highlights_zh: parseLines(e.target.value) }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="封面兜底（legacy）" description="仅作为兜底：当没有 project_images 封面/图库时，前台会回退到这里。建议还是在“项目图片”里设置 cover。" helpText="这是旧封面字段。优先去项目图片里设置 cover，这里只做备用。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="projects.image_url（兜底封面）"
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`projects/${record.id || "draft"}`}
                usageType="project"
                helpText="注意：前台优先使用 project_images 的 cover/gallery；这里只作为兜底。"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminProjectImages projectId={record.id} />

        <AdminFormSection title="SEO（中文）" description="用于前台 meta title / description，留空时前台会回退默认值。" helpText="管理中文案例详情页的搜索标题和搜索描述。">
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
            <AdminFormSection title="英文内容（可折叠）" description="英文为空时前台英文页会回退中文。" helpText="管理英文案例内容，没填英文时，英文前台会回退显示中文。">
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
                  <label className="mb-1 block text-sm font-medium">英文正文 content_en</label>
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">客户需求 client_need_en</label>
                  <Textarea rows={4} value={record.client_need_en} onChange={(e) => setRecord((r) => ({ ...r, client_need_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">项目亮点 highlights_en（每行一个）</label>
                  <Textarea rows={6} value={formatLines(record.highlights_en)} onChange={(e) => setRecord((r) => ({ ...r, highlights_en: parseLines(e.target.value) }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="SEO（英文）" description="可选；为空时前台会回退。" helpText="管理英文案例详情页 SEO 文案。为空时前台会自动回退。">
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
    </>
  );
}
