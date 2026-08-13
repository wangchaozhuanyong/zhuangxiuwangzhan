import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { adminPromotionsEditorText } from "@/i18n/adminPromotionsEditorText";
import { promotionsPageText } from "@/i18n/newClientPageText";
import { useAdminSimpleCmsRows } from "@/lib/adminCmsQueries";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import { toArray, toRecord, toText } from "@/lib/recordUtils";
import AdminImageUpload from "./AdminImageUpload";

type Offer = { title: string; description: string; terms: string };
type PromotionRecord = Record<string, unknown>;

const emptyOffer = (): Offer => ({ title: "", description: "", terms: "" });

const normalizeOffers = (value: unknown): Offer[] =>
  toArray(value)
    .map(toRecord)
    .map((item) => ({
      title: toText(item.title),
      description: toText(item.description),
      terms: toText(item.terms),
    }))
    .filter((item) => item.title || item.description || item.terms);

const cleanOffers = (items: Offer[]) =>
  items
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      terms: item.terms.trim(),
    }))
    .filter((item) => item.title || item.description || item.terms);

const createDefaultRecord = (): PromotionRecord => ({
  page_key: "promotions",
  path: "/promotions",
  title_zh: promotionsPageText.zh.title,
  title_en: promotionsPageText.en.title,
  subtitle_zh: promotionsPageText.zh.eyebrow,
  subtitle_en: promotionsPageText.en.eyebrow,
  description_zh: promotionsPageText.zh.intro,
  description_en: promotionsPageText.en.intro,
  cta_description_zh: promotionsPageText.zh.intro,
  cta_description_en: promotionsPageText.en.intro,
  seo_title_zh: promotionsPageText.zh.metaTitle,
  seo_title_en: promotionsPageText.en.metaTitle,
  seo_description_zh: promotionsPageText.zh.metaDescription,
  seo_description_en: promotionsPageText.en.metaDescription,
  items_zh: promotionsPageText.zh.defaultOffers.map((item) => ({ ...item })),
  items_en: promotionsPageText.en.defaultOffers.map((item) => ({ ...item })),
  status: "published",
  sort_order: 25,
});

const readString = (record: PromotionRecord, key: string) => String(record[key] || "");

const OfferEditor = ({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Offer[];
  onChange: (items: Offer[]) => void;
}) => {
  const t = adminPromotionsEditorText[getAdminLang()];
  const update = (index: number, patch: Partial<Offer>) =>
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, emptyOffer()])}>
          <Plus className="mr-2 h-4 w-4" /> {t.addOffer}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t.offer.replace("{index}", String(index + 1))}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" disabled={index === 0} aria-label={t.moveUp} onClick={() => move(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" disabled={index === items.length - 1} aria-label={t.moveDown} onClick={() => move(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={t.remove} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Input value={item.title} placeholder={t.offerTitle} aria-label={t.offerTitle} onChange={(event) => update(index, { title: event.target.value })} />
              <Textarea rows={3} value={item.description} placeholder={t.offerDescription} aria-label={t.offerDescription} onChange={(event) => update(index, { description: event.target.value })} />
              <Textarea rows={3} value={item.terms} placeholder={t.offerTerms} aria-label={t.offerTerms} onChange={(event) => update(index, { terms: event.target.value })} />
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{t.noOffers}</p> : null}
      </div>
    </section>
  );
};

export default function AdminPromotionsEditor() {
  const language = getAdminLang();
  const t = adminPromotionsEditorText[language];
  const queryClient = useQueryClient();
  const { data: rows = [], isFetching, error, refetch } = useAdminSimpleCmsRows("site_pages");
  const storedRecord = useMemo(
    () => (rows as PromotionRecord[]).find((row) => String(row.page_key || "") === "promotions"),
    [rows],
  );
  const [record, setRecord] = useState<PromotionRecord>(createDefaultRecord);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useUnsavedChangesWarning(dirty && !saving);

  useEffect(() => {
    if (dirtyRef.current || isFetching) return;
    setRecord(storedRecord ? { ...storedRecord } : createDefaultRecord());
  }, [isFetching, storedRecord]);

  const update = (key: string, value: unknown) => {
    dirtyRef.current = true;
    setDirty(true);
    setMessage("");
    setRecord((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!isSupabaseConfigured || saving) return;
    setSaving(true);
    setMessage("");
    const id = typeof record.id === "string" || typeof record.id === "number" ? record.id : undefined;
    const updatedAt = typeof record.updated_at === "string" ? record.updated_at : null;
    const payload: PromotionRecord = {
      page_key: "promotions",
      path: "/promotions",
      title_zh: readString(record, "title_zh").trim() || promotionsPageText.zh.title,
      title_en: readString(record, "title_en").trim() || promotionsPageText.en.title,
      subtitle_zh: readString(record, "subtitle_zh").trim(),
      subtitle_en: readString(record, "subtitle_en").trim(),
      description_zh: readString(record, "description_zh").trim(),
      description_en: readString(record, "description_en").trim(),
      cta_description_zh: readString(record, "cta_description_zh").trim(),
      cta_description_en: readString(record, "cta_description_en").trim(),
      image_url: readString(record, "image_url").trim() || null,
      alt_zh: readString(record, "alt_zh").trim() || null,
      alt_en: readString(record, "alt_en").trim() || null,
      seo_title_zh: readString(record, "seo_title_zh").trim(),
      seo_title_en: readString(record, "seo_title_en").trim(),
      seo_description_zh: readString(record, "seo_description_zh").trim(),
      seo_description_en: readString(record, "seo_description_en").trim(),
      seo_keywords_zh: readString(record, "seo_keywords_zh").trim(),
      seo_keywords_en: readString(record, "seo_keywords_en").trim(),
      items_zh: cleanOffers(normalizeOffers(record.items_zh)),
      items_en: cleanOffers(normalizeOffers(record.items_en)),
      status: readString(record, "status") || "published",
      sort_order: Number(record.sort_order || 25),
    };

    try {
      const saved = await saveAdminRecord<PromotionRecord>({
        table: "site_pages",
        id,
        expectedUpdatedAt: updatedAt,
        payload,
        queryClient,
      });
      dirtyRef.current = false;
      setDirty(false);
      setRecord(saved);
      setMessage(t.saved);
      void queryClient.invalidateQueries({ queryKey: ["admin", "site_pages", "rows"] });
      await refetch();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const textField = (key: string, label: string, multiline = false) => (
    <div className={multiline ? "md:col-span-2" : ""}>
      <AdminFieldLabel label={label} />
      {multiline ? (
        <Textarea rows={4} value={readString(record, key)} onChange={(event) => update(key, event.target.value)} />
      ) : (
        <Input value={readString(record, key)} onChange={(event) => update(key, event.target.value)} />
      )}
    </div>
  );

  if (isFetching && !storedRecord) {
    return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground" role="status">{t.loading}</div>;
  }

  return (
    <div>
      <AdminPageHeader
        title={t.title}
        description={t.description}
        actions={<span className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">{t.fixedPath}: /promotions</span>}
      />

      {error ? (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <p>{t.loadError}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>{t.retry}</Button>
        </div>
      ) : null}
      {!isSupabaseConfigured ? <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{t.unavailable}</p> : null}
      {message ? <p className="mb-5 rounded-lg bg-muted p-4 text-sm" role="status">{message}</p> : null}
      {dirty ? <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{t.unsaved}</p> : null}

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-5 text-lg font-semibold">{t.pageContent}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {textField("title_zh", t.titleZh)}
            {textField("title_en", t.titleEn)}
            {textField("subtitle_zh", t.subtitleZh)}
            {textField("subtitle_en", t.subtitleEn)}
            {textField("description_zh", t.descriptionZh, true)}
            {textField("description_en", t.descriptionEn, true)}
            {textField("cta_description_zh", t.ctaDescriptionZh, true)}
            {textField("cta_description_en", t.ctaDescriptionEn, true)}
          </div>
        </section>

        <OfferEditor label={t.offersZh} items={normalizeOffers(record.items_zh)} onChange={(items) => update("items_zh", items)} />
        <OfferEditor label={t.offersEn} items={normalizeOffers(record.items_en)} onChange={(items) => update("items_en", items)} />

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-5 text-lg font-semibold">{t.heroSeo}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AdminFieldLabel label={t.imageUrl} />
              <div className="space-y-3">
                <Input value={readString(record, "image_url")} onChange={(event) => update("image_url", event.target.value)} />
                <AdminImageUpload
                  folder="site_pages/promotions"
                  value={readString(record, "image_url")}
                  previewVariant="cover"
                  recordAsset
                  assetUsageType="hero"
                  onUploaded={(url) => update("image_url", url)}
                />
              </div>
            </div>
            {textField("alt_zh", t.altZh)}
            {textField("alt_en", t.altEn)}
            {textField("seo_title_zh", t.seoTitleZh)}
            {textField("seo_title_en", t.seoTitleEn)}
            {textField("seo_description_zh", t.seoDescriptionZh, true)}
            {textField("seo_description_en", t.seoDescriptionEn, true)}
            {textField("seo_keywords_zh", t.seoKeywordsZh)}
            {textField("seo_keywords_en", t.seoKeywordsEn)}
            <div>
              <AdminFieldLabel label={t.status} />
              <select value={readString(record, "status") || "published"} onChange={(event) => update("status", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {publishStatusOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <AdminFieldLabel label={t.sortOrder} />
              <Input type="number" value={Number(record.sort_order || 25)} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
            </div>
          </div>
        </section>

        <Button type="button" className="w-full sm:w-auto" disabled={!isSupabaseConfigured || saving} onClick={() => void save()}>
          {saving ? t.saving : t.save}
        </Button>
      </div>
    </div>
  );
}
