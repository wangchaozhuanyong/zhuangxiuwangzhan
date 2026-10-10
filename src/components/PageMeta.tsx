import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";
import { siteConfig } from "@/config/site";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { withChineseBrandMetadata } from "@/i18n/brandIdentity";

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

const absoluteMetaImage = (...sources: string[]): string => {
  for (const source of sources) {
    if (!source.trim()) continue;
    try {
      const url = new URL(source.trim(), siteConfig.url);
      if (/^https?:$/.test(url.protocol)) return url.href;
    } catch {
      // An invalid saved image must not prevent the public page from rendering.
    }
  }
  return siteConfig.ogImage;
};

const PageMeta = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalPath,
  noIndex = false,
}: PageMetaProps) => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const brandName = settings.brand_name || "FLASH CAST";
  const companyName = settings.company_name || siteConfig.name;
  const defaultImage = addCacheBuster(settings.og_image_url || siteConfig.ogImage, settings.updated_at);
  const image = absoluteMetaImage(ogImage || "", defaultImage, siteConfig.ogImage);
  const baseTitle = title.includes(brandName) || title.includes(companyName) ? title : `${title} | ${companyName}`;
  const path = canonicalPath ? stripLanguagePrefix(canonicalPath) : stripLanguagePrefix(window.location.pathname);
  const metadata = noIndex ? { title: baseTitle, description }
    : withChineseBrandMetadata({ title: baseTitle, description }, language, path, settings);
  const canonicalUrl = `${siteConfig.url}${withLanguagePrefix(path, language)}`;
  const zhUrl = `${siteConfig.url}${withLanguagePrefix(path, "zh")}`;
  const enUrl = `${siteConfig.url}${withLanguagePrefix(path, "en")}`;

  return (
    <Helmet>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {keywords && <meta name="keywords" content={keywords} />}
      {!noIndex && <link rel="canonical" href={canonicalUrl} />}
      {!noIndex && <link rel="alternate" hrefLang="zh-CN" href={zhUrl} />}
      {!noIndex && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {!noIndex && <link rel="alternate" hrefLang="x-default" href={enUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default PageMeta;
