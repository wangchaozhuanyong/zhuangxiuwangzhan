import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useInteractionQuery } from "@/hooks/useInteractionQuery";
import { useAdminListingState } from "@/hooks/useAdminListingState";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { loadAdminFurnitureCatalogRows } from "@/backend/modules/materials/service/materialService";
import { useAdminSimpleCmsRows } from "@/lib/adminCmsQueries";
import { ADMIN_LIST_STALE_TIME, adminQueriesEnabled } from "@/lib/adminQueryCore";
import { furnitureCatalog, furnitureProductPath, getFurnitureProductCategory, localizeFurnitureProduct, type FurnitureProduct } from "@/lib/furnitureCatalog";
import { FURNITURE_CATALOG_SECTION_KEY, readFurnitureCatalogOverrides, type FurnitureCatalogOverride } from "@/lib/furnitureCatalogOverrides";
import { saveAdminRecord } from "@/lib/adminMutation";
import { adminStatusLabel, getAdminLang } from "@/lib/adminLocale";
import { formatUserFacingError } from "@/lib/userFacingText";
import { furnitureCategoryName, furnitureText } from "@/i18n/furnitureText";
import { adminContentSyncText } from "@/i18n/adminContentSyncText";
import { toast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Row = { id: string; slug: string; title: string; image: string; category: string; status: string; baseline?: FurnitureProduct };

function CatalogEditor({ product, onClose }: { product: FurnitureProduct; onClose: () => void }) {
  const language = getAdminLang();
  const t = adminContentSyncText[language];
  const qc = useQueryClient();
  const query = useAdminSimpleCmsRows("home_sections");
  const setting = query.data?.find((row) => row.section_key === FURNITURE_CATALOG_SECTION_KEY);
  const overrides = readFurnitureCatalogOverrides(setting?.items_zh);
  const remote = useMemo(() => {
    const zh = localizeFurnitureProduct(product, "zh");
    const en = localizeFurnitureProduct(product, "en");
    return readFurnitureCatalogOverrides(setting?.items_zh).find((row) => row.slug === product.slug) || {
      slug: product.slug, enabled: true, name_zh: zh.name, name_en: en.name,
      shortDescription_zh: zh.shortDescription, shortDescription_en: en.shortDescription,
      description_zh: zh.description, description_en: en.description, price: product.price || "", images: product.images,
    };
  }, [product, setting]);
  const { state: form, setForm, dirty, applyRemote } = useAdminFormState<FurnitureCatalogOverride>(remote, { initial: remote, resetKey: product.slug });
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  useUnsavedChangesWarning(dirty || isSubmitting);
  const close = async () => {
    if (isSubmitting) return;
    if (dirty && !await adminConfirm({ title: t.discardTitle, description: t.discardDescription, confirmLabel: t.discardConfirm })) return;
    onClose();
  };
  const save = protectSubmission("catalog", async (restore = false) => {
    if (!query.data || query.isFetching || query.error) return;
    const submitted = form;
    const cleaned = { ...form, images: form.images.map((url) => url.trim()).filter(Boolean) };
    if (!restore && (!form.name_zh.trim() || !form.name_en.trim() || !cleaned.images.length)) {
      toast({ title: t.required, variant: "destructive" }); return;
    }
    if (!restore && cleaned.images.some((url) => !/^\/(?!\/)/.test(url) && !/^https:\/\//.test(url))) {
      toast({ title: t.invalidImage, variant: "destructive" }); return;
    }
    const next = overrides.filter((row) => row.slug !== product.slug);
    if (!restore) next.push(cleaned);
    try {
      await saveAdminRecord({ table: "home_sections", id: setting?.id as string | undefined,
        expectedUpdatedAt: setting?.updated_at as string | undefined,
        payload: { section_key: FURNITURE_CATALOG_SECTION_KEY, status: "published", items_zh: next, items_en: next }, queryClient: qc });
      applyRemote(restore ? remote : cleaned, submitted);
      toast({ title: t.saved });
      onClose();
    } catch (error) { toast({ title: t.failed, description: formatUserFacingError(error, language), variant: "destructive" }); }
  });
  const fields = [
    ["name_zh", t.titleZh], ["name_en", t.titleEn], ["shortDescription_zh", t.summaryZh], ["shortDescription_en", t.summaryEn],
    ["description_zh", t.descriptionZh], ["description_en", t.descriptionEn], ["price", t.price],
  ] as const;
  return <Dialog open onOpenChange={(open) => { if (!open) void close(); }}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>{t.edit} · {localizeFurnitureProduct(product, language).name}</DialogTitle><DialogDescription>{t.catalogHelp}</DialogDescription></DialogHeader>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><label htmlFor="catalog-visible">{t.visible}</label><Switch id="catalog-visible" language={language} checked={form.enabled} onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))} /></div>
        <div className="grid gap-4 md:grid-cols-2">{fields.map(([key, label]) => <div key={key} className={key === "price" ? "md:col-span-2" : ""}>
          <label htmlFor={`catalog-${key}`} className="mb-1 block text-sm">{label}</label>
          {key.startsWith("description") || key.startsWith("shortDescription")
            ? <Textarea id={`catalog-${key}`} rows={key.startsWith("description") ? 5 : 3} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} />
            : <Input id={`catalog-${key}`} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} />}
        </div>)}</div>
        <label htmlFor="catalog-images" className="block text-sm">{t.images}</label><Textarea id="catalog-images" rows={4} value={form.images.join("\n")} onChange={(e) => setForm((current) => ({ ...current, images: e.target.value.split("\n") }))} />
        <p className="text-sm text-muted-foreground">{t.restoreHelp}</p>
        <div className="flex flex-wrap gap-2"><Button disabled={query.isFetching || !query.data || Boolean(query.error)} onClick={() => void save()}>{isSubmitting ? t.saving : t.save}</Button><Button variant="outline" onClick={() => void close()}>{t.cancel}</Button><Button variant="outline" disabled={query.isFetching || !query.data || Boolean(query.error)} onClick={() => void save(true)}>{t.restoring}</Button></div>
      </fieldset>
    </DialogContent>
  </Dialog>;
}

export default function AdminFurnitureCatalog() {
  const language = getAdminLang();
  const t = adminContentSyncText[language];
  const list = useAdminListingState();
  const status = list.filter("status");
  const source = list.filter("source");
  const managed = useInteractionQuery({ queryKey: ["admin", "materials", "furniture_catalog"], queryFn: ({ signal }) => loadAdminFurnitureCatalogRows(signal), enabled: adminQueriesEnabled, staleTime: ADMIN_LIST_STALE_TIME });
  const settings = useAdminSimpleCmsRows("home_sections");
  const overrides = readFurnitureCatalogOverrides(settings.data?.find((row) => row.section_key === FURNITURE_CATALOG_SECTION_KEY)?.items_zh);
  const [editing, setEditing] = useState<FurnitureProduct | null>(null);
  const baselineRows: Row[] = furnitureCatalog.products.map((product) => {
    const override = overrides.find((row) => row.slug === product.slug);
    return { id: product.slug, slug: product.slug, title: override?.[`name_${language}`] || localizeFurnitureProduct(product, language).name,
      image: override?.images[0] || product.images[0], category: getFurnitureProductCategory(product)?.key || "new", status: override?.enabled === false ? "archived" : "published", baseline: product };
  });
  const managedRows: Row[] = (managed.data || []).map((row) => ({ id: String(row.id), slug: String(row.slug), title: String(row[`title_${language}`] || row.title_zh || row.title_en || row.slug), image: String(row.image_url || ""), category: String(row.subcategory || "new"), status: String(row.status || "draft") }));
  const search = list.deferredSearch.trim().toLowerCase();
  const rows = [...baselineRows, ...managedRows].filter((row) => (source === "all" || (source === "catalog" ? Boolean(row.baseline) : !row.baseline))
    && (status === "all" || row.status === status) && `${row.title} ${row.slug} ${row.category} ${row.baseline?.sku || ""}`.toLowerCase().includes(search));
  const pageSize = 30;
  const page = Math.min(list.page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));
  const busy = managed.isFetching || settings.isFetching;
  const columns: AdminDataTableColumn<Row>[] = [
    { key: "product", header: furnitureText[language].title, cell: (row) => <div className="flex min-w-0 items-center gap-3"><SmartImage src={row.image} alt={row.title} width={96} height={96} className="h-12 w-12 shrink-0 object-cover" /><div className="min-w-0"><p className="font-medium">{row.title}</p><p className="break-all text-xs text-muted-foreground">{row.slug}</p></div></div> },
    { key: "category", header: furnitureText[language].allProducts, cell: (row) => furnitureCategoryName(row.category, language) },
    { key: "source", header: t.source, cell: (row) => row.baseline ? t.catalog : t.managed },
    { key: "status", header: t.visible, cell: (row) => row.baseline ? row.status === "published" ? t.visible : t.hidden : <AdminStatusBadge status={row.status} /> },
    { key: "actions", header: t.edit, cell: (row) => <div className="flex flex-wrap gap-2">{row.baseline ? <Button size="sm" variant="outline" disabled={busy || Boolean(settings.error)} onClick={() => setEditing(row.baseline!)}>{t.edit}</Button> : <Button size="sm" variant="outline" asChild><Link to={`/admin/furniture/${row.id}`}>{t.edit}</Link></Button>}<Button size="sm" variant="outline" asChild><a href={`/${language}${furnitureProductPath({ slug: row.slug } as FurnitureProduct)}`} target="_blank" rel="noreferrer">{t.preview}</a></Button></div> },
  ];
  return <>
    <AdminPageHeader title={furnitureText[language].title} description={t.catalogHelp} actions={<div className="flex flex-wrap gap-2"><Button disabled={busy} variant="outline" onClick={() => { void managed.refetch(); void settings.refetch(); }}>{t.retry}</Button><Button asChild><Link to="/admin/furniture/new">{t.managed}</Link></Button></div>} />
    <div className="mb-4 grid gap-3 md:grid-cols-3"><Input value={list.search} onChange={(e) => list.setSearch(e.target.value)} aria-label={furnitureText[language].title} placeholder={furnitureText[language].title} />
      <select aria-label={t.source} value={source} onChange={(e) => list.setFilter("source", e.target.value)} className="h-10 rounded-md border border-input bg-background px-3"><option value="all">{t.all}</option><option value="catalog">{t.catalog}</option><option value="managed">{t.managed}</option></select>
      <select aria-label={t.visible} value={status} onChange={(e) => list.setFilter("status", e.target.value)} className="h-10 rounded-md border border-input bg-background px-3"><option value="all">{t.all}</option><option value="published">{t.visible}</option><option value="archived">{t.hidden}</option><option value="draft">{adminStatusLabel("default", "draft")}</option></select>
    </div>
    {(managed.error || settings.error) && <AdminAlert tone="error">{formatUserFacingError(managed.error || settings.error, language)}</AdminAlert>}
    {!settings.data && settings.isLoading ? <AdminLoadingState /> : <AdminDataTable columns={columns} rows={rows.slice(page * pageSize, (page + 1) * pageSize)} rowKey={(row) => `${row.baseline ? "catalog" : "managed"}:${row.id}`} busy={busy} />}
    <AdminListPager page={page} pageSize={pageSize} total={rows.length} isFetching={busy} itemLabel={furnitureText[language].products} onPageChange={list.setPage} />
    {editing && <CatalogEditor product={editing} onClose={() => setEditing(null)} />}
  </>;
}
