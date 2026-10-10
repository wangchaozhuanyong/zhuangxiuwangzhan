import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { addCacheBuster, resolveAppleTouchIconUrl, resolveBrowserFaviconUrl } from "@/lib/siteSettingsApi";
import { getPublicSiteName } from "@/i18n/brandIdentity";

const DynamicBrandHead = () => {
  const settings = useSiteSettings();
  const favicon = resolveBrowserFaviconUrl(settings);
  const touchIcon = resolveAppleTouchIconUrl(settings);
  const ogImage = addCacheBuster(settings.og_image_url || settings.logo_url, settings.updated_at);

  return (
    <Helmet>
      {favicon && <link key="brand-favicon" rel="icon" type="image/png" sizes="512x512" href={favicon} />}
      {touchIcon && <link key="brand-touch-icon" rel="apple-touch-icon" sizes="180x180" href={touchIcon} />}
      <meta key="brand-site-name" property="og:site_name" content={getPublicSiteName(settings)} />
      {ogImage && <meta key="brand-og-image" property="og:image" content={ogImage} />}
      {ogImage && <meta key="brand-twitter-image" name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default DynamicBrandHead;
