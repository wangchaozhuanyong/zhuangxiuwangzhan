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

const copy = {
  en: {
    title: "Website Settings",
    description: "Manage company contact details, social links, logo URLs, and default SEO fallback content.",
    company: "Company",
    contact: "Contact",
    media: "Brand Media",
    seo: "Default SEO",
    social: "Social Links",
    save: "Save Settings",
    saving: "Saving...",
    saved: "Settings saved.",
  },
  zh: {
    title: "网站基础设置",
    description: "管理公司联系方式、社交媒体链接、品牌图标地址和默认 SEO 文案。",
    company: "公司信息",
    contact: "联系方式",
    media: "品牌媒体",
    seo: "默认 SEO",
    social: "社交媒体",
    save: "保存设置",
    saving: "保存中...",
    saved: "设置已保存。",
  },
};

const mediaFields = new Set<keyof SiteSettings>(["logo_url", "favicon_url", "og_image_url"]);
const coordinateFields = new Set<keyof SiteSettings>(["map_latitude", "map_longitude"]);

const normalizeComparableText = (value?: string | null) => String(value || "").trim().replace(/\s+/g, " ");

const fields: Array<{ key: keyof SiteSettings; label: string; group: "company" | "contact" | "media" | "seo" | "social"; textarea?: boolean }> = [
  { key: "company_name", label: "公司名称", group: "company" },
  { key: "brand_name", label: "品牌名称", group: "company" },
  { key: "ssm_number", label: "SSM 注册编号", group: "company" },
  { key: "email", label: "邮箱", group: "contact" },
  { key: "phone_display", label: "显示电话", group: "contact" },
  { key: "phone_e164", label: "电话（E.164 国际格式）", group: "contact" },
  { key: "whatsapp_number", label: "WhatsApp 号码", group: "contact" },
  { key: "address_zh", label: "中文地址", group: "contact", textarea: true },
  { key: "address_en", label: "英文地址", group: "contact", textarea: true },
  { key: "short_address_zh", label: "中文短地址", group: "contact" },
  { key: "short_address_en", label: "英文短地址", group: "contact" },
  { key: "map_latitude", label: "地图纬度（Latitude）", group: "contact" },
  { key: "map_longitude", label: "地图经度（Longitude）", group: "contact" },
  { key: "logo_url", label: "品牌图标地址", group: "media" },
  { key: "favicon_url", label: "网站图标地址", group: "media" },
  { key: "og_image_url", label: "默认分享预览图地址", group: "media" },
  { key: "facebook_url", label: "Facebook 链接", group: "social" },
  { key: "instagram_url", label: "Instagram 链接", group: "social" },
  { key: "tiktok_url", label: "TikTok 链接", group: "social" },
  { key: "xiaohongshu_url", label: "小红书链接", group: "social" },
  { key: "linkedin_url", label: "LinkedIn 链接", group: "social" },
  { key: "default_seo_title_zh", label: "默认中文 SEO 标题", group: "seo" },
  { key: "default_seo_title_en", label: "默认英文 SEO 标题", group: "seo" },
  { key: "default_seo_description_zh", label: "默认中文 SEO 描述", group: "seo", textarea: true },
  { key: "default_seo_description_en", label: "默认英文 SEO 描述", group: "seo", textarea: true },
];

const AdminWebsiteSettings = () => {
  const lang = getAdminLang();
  const t = copy[lang];
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
  const coordinateHelp =
    lang === "zh"
      ? "修改地址并保存后，系统会自动更新地图坐标；如果定位不准，也可以手动覆盖。"
      : "When the address changes, saving will auto-update map coordinates. You can still override them manually.";

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
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
        setStatus(
          lang === "zh"
            ? "正在根据新地址自动更新地图坐标..."
            : "Updating map coordinates from the current address...",
        );
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
          const message = error instanceof Error ? error.message : String(error || "");
          setStatus(
            lang === "zh"
              ? `自动定位失败，仍会保存地址；旧坐标会先清空，前台地图会按地址文字显示。原因：${message}`
              : `Automatic coordinate lookup failed; the address will still be saved and old coordinates will be cleared so the map falls back to the address. Reason: ${message}`,
          );
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
        setStatus(lang === "zh" ? "设置已保存，地图坐标已根据当前地址自动更新。" : "Settings saved. Map coordinates were updated automatically.");
      } else if (geocodeStatus === "failed") {
        setStatus(lang === "zh" ? "设置已保存，但自动定位失败。旧坐标已清空，请检查地址是否完整，或手动填写经纬度。" : "Settings saved, but automatic coordinate lookup failed. Old coordinates were cleared. Please check the address or fill latitude/longitude manually.");
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
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display text-xl font-bold">{t[group]}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.filter((field) => field.group === group).map((field) => (
          <div key={field.key} className={field.textarea ? "md:col-span-2" : ""}>
            <label className="mb-1 block text-sm font-medium">{field.label}</label>
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
                  assetUsageType={getAdminImagePreviewVariant(String(field.key)) === "logo" ? "logo" : getAdminImagePreviewVariant(String(field.key)) === "og" ? "og" : "general"}
                  onUploaded={(url) => updateField(field.key, url)}
                />
              </div>
            ) : (
              <Input value={settings[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
            )}
            {coordinateFields.has(field.key) ? <p className="mt-1 text-xs text-muted-foreground">{coordinateHelp}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText="这里管理公司联系方式、品牌图标、社交链接和默认 SEO。"
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
          {status && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{status}</p>}
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? t.saving : t.save}</Button>
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
