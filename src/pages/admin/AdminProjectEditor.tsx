import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/AdminPermission";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import AdminStickyActionBar from "@/components/admin/AdminStickyActionBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import ImageField from "@/components/admin/ImageField";
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminProjectDetail } from "@/lib/adminQueries";
import { publishStatusOptions } from "@/lib/adminLocale";
import AdminProjectImages from "./AdminProjectImages";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";

type ProjectRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
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

const projectEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "client_need_en",
  "highlights_en",
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

export default function AdminProjectEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [showEnglish, setShowEnglish] = useState(true);
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

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<ProjectRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, projectEnglishFields);
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
      const { data, error } = await supabase!.from("projects").select("id").eq("slug", value).limit(1);
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
    return `/${lang}/projects/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: ProjectRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
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
      materials: record.materials || [],
      scope: record.scope || [],
      highlights_zh: record.highlights_zh || [],
      highlights_en: record.highlights_en || [],
    };

    let saved: any;
    try {
      saved = await saveAdminRecord({
        table: "projects",
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

    if (isNew) navigate(`/admin/projects/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "projects", id: savedId, force: Boolean(forceEnglish) },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已自动生成英文" });
        void invalidateAdminContentDetail(queryClient, "projects", savedId);
      }
    }
  };

  const forceRegenerateEnglish = async () => {
    const confirmed = await adminConfirm({
      title: "确认重新生成英文？",
      description: "这会覆盖已有英文内容。建议只在当前英文内容明显不准，或中文内容大幅调整后使用。",
      confirmLabel: "重新生成",
    });
    if (confirmed) {
      await save(undefined, true, true);
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
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={() => void save("draft")} disabled={saveBusy || isLoading}>
              保存草稿
            </AdminActionButton>
            <AdminActionButton action="content.publish" type="button" onClick={() => void save("published")} disabled={saveBusy || isLoading}>
              发布
            </AdminActionButton>
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={() => void save(undefined, true)} disabled={saveBusy || isLoading || !record.id}>
              保存并自动生成英文
            </AdminActionButton>
            <AdminActionButton
              action="content.write"
              type="button"
              variant="outline"
              onClick={() => void forceRegenerateEnglish()}
              disabled={saveBusy || isLoading || !record.id}
            >
              强制重新生成英文
            </AdminActionButton>
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
          description="封面、图库和改造前后图片请在“项目图片”模块里管理，前台缩略图优先使用封面图。"
          helpText="这里主要编辑案例正文、标题、地点、类型和搜索优化。"
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

        <AdminFormSection title="发布与排序" description="草稿不对外展示；发布后会在前台案例页生效。" helpText="控制案例是否在前台显示，以及它在案例列表里的排序。">
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
          </div>
        </AdminFormSection>

        <AdminFormSection title="基础信息（中文）" description="用于案例列表卡片与详情页标题/摘要。前台卡片会自动限制标题和摘要行数，详情页会完整显示正文。" helpText="管理案例中文标题、摘要、正文和基础展示信息。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">案例标题</label>
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
                placeholder="例如：condo-renovation-kl"
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">前台路径：{previewUrl}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">案例摘要</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">项目描述</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="项目资料（中文）" description="用于详情页的项目资料展示。" helpText="管理项目地点、面积、周期、预算、类型、材料、范围和亮点。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">项目类型</label>
              <Input value={record.project_type} onChange={(e) => setRecord((r) => ({ ...r, project_type: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">地区</label>
              <Input value={record.location} onChange={(e) => setRecord((r) => ({ ...r, location: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">面积</label>
              <Input value={record.area} onChange={(e) => setRecord((r) => ({ ...r, area: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">工期</label>
              <Input value={record.duration} onChange={(e) => setRecord((r) => ({ ...r, duration: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">预算</label>
              <Input value={record.budget} onChange={(e) => setRecord((r) => ({ ...r, budget: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">客户需求</label>
              <Textarea rows={4} value={record.client_need_zh} onChange={(e) => setRecord((r) => ({ ...r, client_need_zh: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">使用材料（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.materials)} onChange={(e) => setRecord((r) => ({ ...r, materials: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">施工范围（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.scope)} onChange={(e) => setRecord((r) => ({ ...r, scope: parseLines(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">项目亮点（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.highlights_zh)} onChange={(e) => setRecord((r) => ({ ...r, highlights_zh: parseLines(e.target.value) }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="备用封面" description="仅作为兜底：当没有项目图片封面或图库时，前台会回退到这里。建议还是在“项目图片”里设置封面图。" helpText="这是旧封面字段。优先去项目图片里设置封面图，这里只做备用。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="兜底封面图"
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`projects/${record.id || "draft"}`}
                usageType="project"
                helpText="注意：前台优先使用项目图片里的封面图和图库；这里只作为兜底。"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminProjectImages projectId={record.id} />

        <AdminFormSection title="SEO（中文）" description="用于前台页面标题和页面描述，留空时前台会回退默认值。" helpText="管理中文案例详情页的搜索标题和搜索描述。">
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
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">客户需求（英文）</label>
                  <Textarea rows={4} value={record.client_need_en} onChange={(e) => setRecord((r) => ({ ...r, client_need_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">项目亮点（英文，每行一个）</label>
                  <Textarea rows={6} value={formatLines(record.highlights_en)} onChange={(e) => setRecord((r) => ({ ...r, highlights_en: parseLines(e.target.value) }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="英文 SEO，可手动微调" description={autoEnglishDescription} helpText="管理英文案例详情页的搜索文案。正式英文 SEO 建议补齐。" collapsible defaultOpen={false}>
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
