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
import { useAdminMaterialDetail } from "@/lib/adminQueries";
import { publishStatusOptions } from "@/lib/adminLocale";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";

type MaterialRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;

  category: string;
  subcategory: string;
  material_type: string;
  color: string;
  texture: string;
  reference_price: string;

  suitable_spaces_zh: string[];
  pros_zh: string[];
  cons_zh: string[];
  recommended_pairing_zh: string; // TEXT
  note_zh: string; // TEXT

  image_url: string;
  alt_zh: string;

  seo_title_zh: string;
  seo_description_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;
  suitable_spaces_en: string[];
  pros_en: string[];
  cons_en: string[];
  recommended_pairing_en: string; // TEXT
  note_en: string; // TEXT
  alt_en: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: MaterialRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  category: "",
  subcategory: "",
  material_type: "",
  color: "",
  texture: "",
  reference_price: "",
  suitable_spaces_zh: [],
  pros_zh: [],
  cons_zh: [],
  recommended_pairing_zh: "",
  note_zh: "",
  image_url: "",
  alt_zh: "",
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  suitable_spaces_en: [],
  pros_en: [],
  cons_en: [],
  recommended_pairing_en: "",
  note_en: "",
  alt_en: "",
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

export default function AdminMaterialEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [showEnglish, setShowEnglish] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminMaterialDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<MaterialRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      suitable_spaces_zh: (loaded as any).suitable_spaces_zh || [],
      suitable_spaces_en: (loaded as any).suitable_spaces_en || [],
      pros_zh: (loaded as any).pros_zh || [],
      pros_en: (loaded as any).pros_en || [],
      cons_zh: (loaded as any).cons_zh || [],
      cons_en: (loaded as any).cons_en || [],
      recommended_pairing_zh: (loaded as any).recommended_pairing_zh || "",
      recommended_pairing_en: (loaded as any).recommended_pairing_en || "",
      note_zh: (loaded as any).note_zh || "",
      note_en: (loaded as any).note_en || "",
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<MaterialRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
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
      const { data, error } = await supabase!.from("materials").select("id").eq("slug", value).limit(1);
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
    return `/${lang}/materials/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: MaterialRecord["status"], generateEnglish?: boolean) => {
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
      suitable_spaces_zh: record.suitable_spaces_zh || [],
      suitable_spaces_en: record.suitable_spaces_en || [],
      pros_zh: record.pros_zh || [],
      pros_en: record.pros_en || [],
      cons_zh: record.cons_zh || [],
      cons_en: record.cons_en || [],
      // TEXT fields: keep as plain string
      recommended_pairing_zh: record.recommended_pairing_zh || "",
      recommended_pairing_en: record.recommended_pairing_en || "",
      note_zh: record.note_zh || "",
      note_en: record.note_en || "",
    };

    let saved: any;
    try {
      saved = await saveAdminRecord({
        table: "materials",
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

    if (isNew) navigate(`/admin/materials/${savedId}`, { replace: true });

    if (generateEnglish) {
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: "materials", id: savedId },
      });
      if (translationError) {
        toast({ title: "已保存，但生成英文失败", description: translationError.message, variant: "destructive" });
      } else {
        toast({ title: "已保存，并已发起英文生成" });
        void invalidateAdminContentDetail(queryClient, "materials", savedId);
      }
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用材料后台编辑器。" />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/materials">返回列表</Link>
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
          title={isNew ? "新建材料" : "编辑材料"}
          description="推荐搭配和备注字段使用纯文本，不会再存成数组，避免数据库结构冲突。"
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? "隐藏英文内容" : "显示英文内容"}
            </Button>
          }
        />

        <AdminFormSection title="发布与排序" description="草稿不对外展示；发布后会在前台材料页生效。" helpText="控制材料是否在前台材料库显示，以及它在列表里的排序。">
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

        <AdminFormSection title="基础信息（中文）" description="用于材料列表卡片与详情页标题/摘要。" helpText="管理材料中文名称、摘要和正文。前台材料列表和详情页会读取这里。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">材料名称</label>
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
                placeholder="例如：spc-vinyl-flooring"
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

        <AdminFormSection title="分类与属性" description="用于材料库分类页与详情页展示。" helpText="管理材料分类、类型、颜色和纹理，用于筛选、分类页和详情页。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <Input value={record.category} onChange={(e) => setRecord((r) => ({ ...r, category: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">子分类</label>
              <Input value={record.subcategory} onChange={(e) => setRecord((r) => ({ ...r, subcategory: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">材料类型</label>
              <Input value={record.material_type} onChange={(e) => setRecord((r) => ({ ...r, material_type: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">颜色</label>
              <Input value={record.color} onChange={(e) => setRecord((r) => ({ ...r, color: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">纹理</label>
              <Input value={record.texture} onChange={(e) => setRecord((r) => ({ ...r, texture: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">参考价格</label>
              <Input value={record.reference_price} onChange={(e) => setRecord((r) => ({ ...r, reference_price: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="图片" description="支持粘贴图片链接或直接上传，后续会接入媒体库选择器。" helpText="管理材料封面图，材料列表和详情页会优先使用这里。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label="图片"
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`materials/${record.id || "draft"}`}
                usageType="material"
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

        <AdminFormSection title="适用与评价（中文）" description="数组字段使用“一行一个”。" helpText="管理适用空间、优缺点、搭配建议、价格参考和备注。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">适用空间（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.suitable_spaces_zh)} onChange={(e) => setRecord((r) => ({ ...r, suitable_spaces_zh: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">优点（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.pros_zh)} onChange={(e) => setRecord((r) => ({ ...r, pros_zh: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">缺点（每行一个）</label>
              <Textarea rows={6} value={formatLines(record.cons_zh)} onChange={(e) => setRecord((r) => ({ ...r, cons_zh: parseLines(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">推荐搭配</label>
              <Textarea rows={4} value={record.recommended_pairing_zh} onChange={(e) => setRecord((r) => ({ ...r, recommended_pairing_zh: e.target.value }))} />
              <p className="mt-1 text-xs text-muted-foreground">这个字段是一整段文字，不会按每行拆分。</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">备注</label>
              <Textarea rows={3} value={record.note_zh} onChange={(e) => setRecord((r) => ({ ...r, note_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="SEO（中文）" description="用于前台页面标题和页面描述，留空时前台会回退默认值。" helpText="管理中文材料详情页搜索标题和搜索描述。">
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
            <AdminFormSection title="英文内容（可折叠）" description="英文为空时前台英文页会回退中文。" helpText="管理英文材料内容，没填英文时，英文前台会回退显示中文。">
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
                  <label className="mb-1 block text-sm font-medium">英文详情</label>
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

        <AdminFormSection title="适用与评价（英文）" description="可选；为空时自动回退。" helpText="管理英文适用空间、优缺点、搭配建议和备注。">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">适用空间（英文，每行一个）</label>
                  <Textarea rows={6} value={formatLines(record.suitable_spaces_en)} onChange={(e) => setRecord((r) => ({ ...r, suitable_spaces_en: parseLines(e.target.value) }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">优点（英文，每行一个）</label>
                  <Textarea rows={6} value={formatLines(record.pros_en)} onChange={(e) => setRecord((r) => ({ ...r, pros_en: parseLines(e.target.value) }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">缺点（英文，每行一个）</label>
                  <Textarea rows={6} value={formatLines(record.cons_en)} onChange={(e) => setRecord((r) => ({ ...r, cons_en: parseLines(e.target.value) }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">推荐搭配（英文）</label>
                  <Textarea rows={4} value={record.recommended_pairing_en} onChange={(e) => setRecord((r) => ({ ...r, recommended_pairing_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">备注（英文）</label>
                  <Textarea rows={3} value={record.note_en} onChange={(e) => setRecord((r) => ({ ...r, note_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title="SEO（英文）" description="可选；为空时前台会回退。" helpText="管理英文材料详情页的搜索文案。为空时前台会自动回退。">
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
