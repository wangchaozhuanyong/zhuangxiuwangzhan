import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

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
  const image = ogImage || settings.og_image_url || siteConfig.ogImage;
  const fullTitle = title.includes(brandName) || title.includes(companyName) ? title : `${title} | ${companyName}`;
  const path = canonicalPath ? stripLanguagePrefix(canonicalPath) : stripLanguagePrefix(window.location.pathname);
  const canonicalUrl = `${siteConfig.url}${withLanguagePrefix(path, language)}`;
  const zhUrl = `${siteConfig.url}${withLanguagePrefix(path, "zh")}`;
  const enUrl = `${siteConfig.url}${withLanguagePrefix(path, "en")}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,follow" />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh-CN" href={zhUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default PageMeta;
