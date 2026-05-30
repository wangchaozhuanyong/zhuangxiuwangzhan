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
import { FaqListEditor, ProcessStepsEditor, TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminServiceDetail } from "@/lib/adminQueries";
import { publishStatusOptions } from "@/lib/adminLocale";
import { getAdminFieldHelp } from "@/lib/adminHelpText";

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

const cleanLines = (value?: string[] | null) => (value || []).map((item) => item.trim()).filter(Boolean);
const cleanProcessSteps = (value?: any[] | null) =>
  (value || [])
    .map((item) => ({ ...item, title: String(item?.title || "").trim(), desc: String(item?.desc || "").trim() }))
    .filter((item) => item.title || item.desc);
const cleanFaqs = (value?: any[] | null) =>
  (value || [])
    .map((item) => ({ ...item, q: String(item?.q || "").trim(), a: String(item?.a || "").trim() }))
    .filter((item) => item.q || item.a);

export default function AdminServiceEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [showEnglish, setShowEnglish] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminServiceDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<ServiceRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      suitable_for_zh: (loaded as any).suitable_for_zh || [],
      suitable_for_en: (loaded as any).suitable_for_en || [],
      common_projects_zh: (loaded as any).common_projects_zh || [],
      common_projects_en: (loaded as any).common_projects_en || [],
      scope_items_zh: (loaded as any).scope_items_zh || [],
      scope_items_en: (loaded as any).scope_items_en || [],
      process_steps_zh: (loaded as any).process_steps_zh || [],
      process_steps_en: (loaded as any).process_steps_en || [],
      faqs_zh: (loaded as any).faqs_zh || [],
      faqs_en: (loaded as any).faqs_en || [],
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote } = useAdminFormState<ServiceRecord>(loadedRecord, {
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
      const { data, error } = await supabase!.from("services").select("id").eq("slug", value).limit(1);
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
    return `/${lang}/services/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: ServiceRecord["status"], generateEnglish?: boolean) => {
    if (!isSupabaseConfigured) return;
    const slug = slugify(record.slug || record.title_zh);
    if (!slug) {
      toast({ title: "请填写链接标识或中文标题", variant: "destructive" });
      return;
    }
    const ok = await checkSlugUnique(slug);
    if (!ok) {
      toast({ title: "链接标识不可用", description: slugError || "请修改后再保存。", variant: "destructive" });
      return;
    }

    setSaveBusy(true);
    const payload: any = {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      suitable_for_zh: cleanLines(record.suitable_for_zh),
      suitable_for_en: cleanLines(record.suitable_for_en),
      common_projects_zh: cleanLines(record.common_projects_zh),
      common_projects_en: cleanLines(record.common_projects_en),
      scope_items_zh: cleanLines(record.scope_items_zh),
      scope_items_en: cleanLines(record.scope_items_en),
      process_steps_zh: cleanProcessSteps(record.process_steps_zh),
      process_steps_en: cleanProcessSteps(record.process_steps_en),
      faqs_zh: cleanFaqs(record.faqs_zh),
      faqs_en: cleanFaqs(record.faqs_en),
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
    applyRemote({ ...record, id: savedId, slug, status: payload.status });
    toast({ title: "已保存" });
    void invalidateAfterAdminContentSave(queryClient);

    if (isNew) navigate(`/admin/services/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "services", id: savedId },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已发起英文生成" });
        void invalidateAdminContentDetail(queryClient, "services", savedId);
      }
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后，才能使用服务后台编辑器。" />;
  }

  return (
    <>
      <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/services">返回列表</Link>
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
          title={isNew ? "新建服务" : "编辑服务"}
          description="优先编辑中文内容，英文内容可以自动生成后再复查。保存、发布、预览都在顶部操作栏。"
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? "隐藏英文内容" : "显示英文内容"}
            </Button>
          }
        />

        <AdminFormSection
          title="发布与排序"
          description="草稿不会对外展示，发布后会在前台服务页面生效。"
          helpText="控制服务是否在前台显示，以及它在服务列表里的排序。"
        >
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

        <AdminFormSection
          title="基础信息（中文）"
          description="用于服务列表卡片和详情页标题、摘要。"
          helpText="管理服务中文标题、摘要和正文。前台中文服务列表和详情页会读取这里。"
        >
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
                placeholder="例如：kitchen-renovation"
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">前台路径：{previewUrl}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文摘要</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">中文详情</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title="图片"
          description="支持粘贴图片地址，也可以直接上传。"
          helpText="管理服务封面图，服务列表卡片和详情页头图会优先使用这里。"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="封面图"
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`services/${record.id || "draft"}`}
                usageType="hero"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
                helpText="提示：服务列表与详情页会使用这个封面图。"
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

        <AdminFormSection
          title="业务字段（中文）"
          description="这些字段会被前台服务详情页读取。"
          helpText="管理适合场景、常见项目、服务范围、流程和常见问题，都会显示在服务详情页。"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <TextListEditor
                label="适合场景"
                helpText={getAdminFieldHelp("suitable_for_zh")}
                value={record.suitable_for_zh}
                onChange={(value) => setRecord((r) => ({ ...r, suitable_for_zh: value }))}
                placeholder="例如：公寓装修、旧房翻新"
              />
            </div>
            <div>
              <TextListEditor
                label="常见项目"
                helpText={getAdminFieldHelp("common_projects_zh")}
                value={record.common_projects_zh}
                onChange={(value) => setRecord((r) => ({ ...r, common_projects_zh: value }))}
                placeholder="例如：厨房翻新、浴室防水"
              />
            </div>
            <div className="md:col-span-2">
              <TextListEditor
                label="服务范围"
                helpText={getAdminFieldHelp("scope_items_zh")}
                value={record.scope_items_zh}
                onChange={(value) => setRecord((r) => ({ ...r, scope_items_zh: value }))}
                placeholder="例如：水电工程、木作、油漆"
              />
            </div>
            <div className="md:col-span-2">
              <ProcessStepsEditor
                label="服务步骤"
                helpText={getAdminFieldHelp("process_steps_zh")}
                value={record.process_steps_zh}
                onChange={(value) => setRecord((r) => ({ ...r, process_steps_zh: value }))}
              />
            </div>
            <div className="md:col-span-2">
              <FaqListEditor
                label="服务问答"
                helpText={getAdminFieldHelp("faqs_zh")}
                value={record.faqs_zh}
                onChange={(value) => setRecord((r) => ({ ...r, faqs_zh: value }))}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title="SEO（中文）"
          description="用于前台页面标题和页面描述，留空时前台会回退默认值。"
          helpText="管理中文页面在浏览器标题、搜索结果和分享卡片里的文案。"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO 标题</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO 描述</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        {showEnglish && (
          <>
            <AdminFormSection
              title="英文内容（可选）"
              description="英文为空时，英文前台页面会回退显示中文。"
              helpText="管理英文服务内容。没有填写英文时，英文前台会自动回退显示中文。"
            >
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
              </div>
            </AdminFormSection>

            <AdminFormSection
              title="业务字段（英文）"
              description="可选；为空时自动回退中文。"
              helpText="管理英文服务详情页的列表、流程和常见问题。"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <TextListEditor
                    label="适合场景（英文）"
                    helpText={getAdminFieldHelp("suitable_for_en")}
                    value={record.suitable_for_en}
                    onChange={(value) => setRecord((r) => ({ ...r, suitable_for_en: value }))}
                    placeholder="例如：Condo renovation"
                  />
                </div>
                <div>
                  <TextListEditor
                    label="常见项目（英文）"
                    helpText={getAdminFieldHelp("common_projects_en")}
                    value={record.common_projects_en}
                    onChange={(value) => setRecord((r) => ({ ...r, common_projects_en: value }))}
                    placeholder="例如：Kitchen upgrade"
                  />
                </div>
                <div className="md:col-span-2">
                  <TextListEditor
                    label="服务范围（英文）"
                    helpText={getAdminFieldHelp("scope_items_en")}
                    value={record.scope_items_en}
                    onChange={(value) => setRecord((r) => ({ ...r, scope_items_en: value }))}
                    placeholder="例如：Electrical works"
                  />
                </div>
                <div className="md:col-span-2">
                  <ProcessStepsEditor
                    label="服务步骤（英文）"
                    helpText={getAdminFieldHelp("process_steps_en")}
                    value={record.process_steps_en}
                    onChange={(value) => setRecord((r) => ({ ...r, process_steps_en: value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <FaqListEditor
                    label="服务问答（英文）"
                    helpText={getAdminFieldHelp("faqs_en")}
                    value={record.faqs_en}
                    onChange={(value) => setRecord((r) => ({ ...r, faqs_en: value }))}
                  />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection
              title="SEO（英文）"
              description="可选；为空时前台会自动回退。"
              helpText="管理英文页面的搜索文案。为空时前台会自动回退。"
            >
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
