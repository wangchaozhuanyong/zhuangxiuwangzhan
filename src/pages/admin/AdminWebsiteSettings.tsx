import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchSiteSettings, fallbackSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";
import { invalidateSiteSettings } from "@/lib/adminInvalidate";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
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

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(t.saving);
    try {
      const saved = await saveAdminRecord<SiteSettings>({
        table: "site_settings",
        id: "default",
        payload: { id: "default", ...settings },
        expectedUpdatedAt: settings.updated_at || null,
        action: "update_settings",
        queryClient,
        invalidate: "published",
      });
      await invalidateSiteSettings(queryClient);
      const fresh = { ...fallbackSiteSettings, ...saved };
      applyRemote(fresh);
      setStatus(t.saved);
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
                  onUploaded={(url) => updateField(field.key, url)}
                />
              </div>
            ) : (
              <Input value={settings[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
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
