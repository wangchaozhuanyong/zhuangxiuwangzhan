import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DynamicBrandHead = () => {
  const settings = useSiteSettings();
  const favicon = settings.favicon_url || settings.logo_url;
  const ogImage = settings.og_image_url || settings.logo_url;

  return (
    <Helmet>
      {favicon && <link rel="icon" href={favicon} />}
      {favicon && <link rel="apple-touch-icon" href={favicon} />}
      <meta property="og:site_name" content={settings.company_name} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default DynamicBrandHead;
