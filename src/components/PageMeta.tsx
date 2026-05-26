import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";
import { siteConfig } from "@/config/site";

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
}

const PageMeta = ({
  title,
  description,
  keywords,
  ogImage = siteConfig.ogImage,
  ogType = "website",
  canonicalPath,
}: PageMetaProps) => {
  const { language } = useLanguage();
  const fullTitle = title.includes("FLASH CAST") ? title : `${title} | FLASH CAST SDN. BHD.`;
  const path = canonicalPath ? stripLanguagePrefix(canonicalPath) : stripLanguagePrefix(window.location.pathname);
  const canonicalUrl = `${siteConfig.url}${withLanguagePrefix(path, language)}`;
  const zhUrl = `${siteConfig.url}${withLanguagePrefix(path, "zh")}`;
  const enUrl = `${siteConfig.url}${withLanguagePrefix(path, "en")}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh-CN" href={zhUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default PageMeta;
