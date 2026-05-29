import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { addCacheBuster } from "@/lib/siteSettingsApi";

const DynamicBrandHead = () => {
  const settings = useSiteSettings();
  const favicon = addCacheBuster(settings.favicon_url || settings.logo_url, settings.updated_at);
  const ogImage = addCacheBuster(settings.og_image_url || settings.logo_url, settings.updated_at);

  return (
    <Helmet>
      {favicon && <link key="brand-favicon" rel="icon" href={favicon} />}
      {favicon && <link key="brand-touch-icon" rel="apple-touch-icon" href={favicon} />}
      <meta key="brand-site-name" property="og:site_name" content={settings.company_name} />
      {ogImage && <meta key="brand-og-image" property="og:image" content={ogImage} />}
      {ogImage && <meta key="brand-twitter-image" name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default DynamicBrandHead;
