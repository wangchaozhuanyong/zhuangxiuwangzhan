import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchSiteSettings, fallbackSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";
import { invalidateSiteSettings } from "@/lib/adminInvalidate";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { geocodeAddress } from "@/lib/geocodeApi";
import AdminImageUpload, { getAdminImagePreviewVariant } from "./AdminImageUpload";
import { getAdminLang } from "@/lib/adminLocale";
import { adminWebsiteSettingsFieldText, adminWebsiteSettingsText } from "@/i18n/adminWebsiteSettingsText";
import { formatUserFacingError } from "@/lib/userFacingText";

const mediaFields = new Set<keyof SiteSettings>(["logo_url", "favicon_url", "og_image_url"]);
const coordinateFields = new Set<keyof SiteSettings>(["map_latitude", "map_longitude"]);

const normalizeComparableText = (value?: string | null) => String(value || "").trim().replace(/\s+/g, " ");
const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

const fields: Array<{ key: keyof SiteSettings; group: "company" | "contact" | "media" | "seo" | "social"; textarea?: boolean }> = [
  { key: "company_name", group: "company" },
  { key: "brand_name", group: "company" },
  { key: "ssm_number", group: "company" },
  { key: "email", group: "contact" },
  { key: "phone_display", group: "contact" },
  { key: "phone_e164", group: "contact" },
  { key: "whatsapp_number", group: "contact" },
  { key: "address_zh", group: "contact", textarea: true },
  { key: "address_en", group: "contact", textarea: true },
  { key: "short_address_zh", group: "contact" },
  { key: "short_address_en", group: "contact" },
  { key: "map_latitude", group: "contact" },
  { key: "map_longitude", group: "contact" },
  { key: "logo_url", group: "media" },
  { key: "favicon_url", group: "media" },
  { key: "og_image_url", group: "media" },
  { key: "facebook_url", group: "social" },
  { key: "instagram_url", group: "social" },
  { key: "tiktok_url", group: "social" },
  { key: "xiaohongshu_url", group: "social" },
  { key: "linkedin_url", group: "social" },
  { key: "default_seo_title_zh", group: "seo" },
  { key: "default_seo_title_en", group: "seo" },
  { key: "default_seo_description_zh", group: "seo", textarea: true },
  { key: "default_seo_description_en", group: "seo", textarea: true },
];

const AdminWebsiteSettings = () => {
  const lang = getAdminLang();
  const t = adminWebsiteSettingsText[lang];
  const fieldText = adminWebsiteSettingsFieldText[lang];
  const queryClient = useQueryClient();
  const { data: remoteSettings, isFetched } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });
  const { state: settings, setForm: setSettings, applyRemote, dirty } = useAdminFormState<SiteSettings>(
    isFetched ? remoteSettings ?? fallbackSiteSettings : undefined,
    { initial: fallbackSiteSettings },
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  useUnsavedChangesWarning(dirty && !saving);

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const getMediaUsageType = (key: keyof SiteSettings) => {
    if (key === "logo_url") return "logo";
    if (key === "favicon_url") return "icon";
    if (key === "og_image_url") return "og";
    return "general";
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(t.saving);
    try {
      const original = remoteSettings ?? fallbackSiteSettings;
      const addressChanged =
        normalizeComparableText(settings.address_zh) !== normalizeComparableText(original.address_zh) ||
        normalizeComparableText(settings.address_en) !== normalizeComparableText(original.address_en);
      const coordinatesChanged =
        normalizeComparableText(settings.map_latitude) !== normalizeComparableText(original.map_latitude) ||
        normalizeComparableText(settings.map_longitude) !== normalizeComparableText(original.map_longitude);
      const coordinatesMissing = !normalizeComparableText(settings.map_latitude) || !normalizeComparableText(settings.map_longitude);
      const shouldAutoGeocode = (addressChanged && !coordinatesChanged) || coordinatesMissing;
      const addressForGeocode = normalizeComparableText(settings.address_en || settings.address_zh);
      let payload: SiteSettings = { ...settings };
      let geocodeStatus: "updated" | "skipped" | "failed" = "skipped";

      if (shouldAutoGeocode && addressForGeocode) {
        setStatus(t.geocodeUpdating);
        try {
          const geocoded = await geocodeAddress(addressForGeocode);
          payload = {
            ...payload,
            map_latitude: geocoded.latitude,
            map_longitude: geocoded.longitude,
          };
          geocodeStatus = "updated";
        } catch (error) {
          geocodeStatus = "failed";
          if (addressChanged && !coordinatesChanged) {
            payload = {
              ...payload,
              map_latitude: "",
              map_longitude: "",
            };
          }
          const message = formatUserFacingError(error, lang);
          setStatus(formatText(t.geocodeFailed, { message }));
        }
      }

      const saved = await saveAdminRecord<SiteSettings>({
        table: "site_settings",
        id: "default",
        payload: { id: "default", ...payload },
        expectedUpdatedAt: settings.updated_at || null,
        action: "update_settings",
        queryClient,
        invalidate: "published",
      });
      await invalidateSiteSettings(queryClient);
      const fresh = { ...fallbackSiteSettings, ...saved };
      applyRemote(fresh);
      if (geocodeStatus === "updated") {
        setStatus(t.savedGeocodeUpdated);
      } else if (geocodeStatus === "failed") {
        setStatus(t.savedGeocodeFailed);
      } else {
        setStatus(t.saved);
      }
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (group: "company" | "contact" | "media" | "seo" | "social") => (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 font-display text-xl font-bold">{t[group]}</h2>
      {group === "seo" && (
        <div className="mb-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t.seoNoticeTitle}</p>
          <p className="mt-1">{t.seoNoticeBody}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.filter((field) => field.group === group).map((field) => {
          const copy = fieldText[field.key as keyof typeof fieldText];
          return (
          <div key={field.key} className={field.textarea ? "md:col-span-2" : ""}>
            <label className="mb-1 block text-sm font-medium">{copy.label}</label>
            {field.textarea ? (
              <Textarea rows={3} value={settings[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
            ) : mediaFields.has(field.key) ? (
              <div className="space-y-3">
                <Input value={settings[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
                <AdminImageUpload
                  folder="site-settings"
                  value={settings[field.key] || ""}
                  previewVariant={getAdminImagePreviewVariant(String(field.key))}
                  recordAsset
                  assetUsageType={getMediaUsageType(field.key)}
                  onUploaded={(url) => updateField(field.key, url)}
                />
              </div>
            ) : (
              <Input value={settings[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
            )}
            {"help" in copy && copy.help ? <p className="mt-1 text-xs text-muted-foreground">{copy.help}</p> : null}
            {coordinateFields.has(field.key) ? <p className="mt-1 text-xs text-muted-foreground">{t.coordinateHelp}</p> : null}
          </div>
        )})}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText={t.pageHelp}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-start md:justify-between sm:p-6">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold sm:text-2xl">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
          {status && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{status}</p>}
        </div>
        <Button className="w-full md:w-auto" onClick={handleSave} disabled={saving}>{saving ? t.saving : t.save}</Button>
      </div>
      {renderGroup("company")}
      {renderGroup("contact")}
      {renderGroup("media")}
      {renderGroup("social")}
      {renderGroup("seo")}
    </div>
  );
};

export default AdminWebsiteSettings;
