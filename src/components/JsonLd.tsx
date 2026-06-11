import { siteConfig, socialProfileUrls } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const shouldRenderClientJsonLd = import.meta.env.DEV;

const JsonLdScript = ({ data }: { data: unknown }) => {
  if (!shouldRenderClientJsonLd) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

const createOrganizationData = (settings: ReturnType<typeof useSiteSettings>) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: settings.company_name,
  alternateName: settings.brand_name,
  url: siteConfig.url,
  logo: settings.logo_url || siteConfig.logoUrl,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: settings.phone_e164,
    contactType: "customer service",
    areaServed: "MY",
    availableLanguage: ["English", "Malay", "Chinese"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: settings.address_en || settings.address_zh || siteConfig.address,
    addressLocality: "Kuala Lumpur",
    postalCode: "58200",
    addressRegion: "Kuala Lumpur",
    addressCountry: "MY",
  },
  sameAs: [
    settings.facebook_url,
    settings.instagram_url,
    settings.tiktok_url,
    settings.xiaohongshu_url,
    settings.linkedin_url,
    ...socialProfileUrls,
  ].filter(Boolean),
});

const createLocalBusinessData = (settings: ReturnType<typeof useSiteSettings>) => ({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${siteConfig.url}/#localbusiness`,
  name: settings.company_name,
  alternateName: settings.brand_name,
  description: settings.default_seo_description_en,
  url: siteConfig.url,
  telephone: settings.phone_e164,
  email: settings.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: settings.address_en || settings.address_zh || siteConfig.address,
    addressLocality: "Kuala Lumpur",
    postalCode: "58200",
    addressRegion: "Kuala Lumpur",
    addressCountry: "MY",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: settings.map_latitude || siteConfig.mapLatitude,
    longitude: settings.map_longitude || siteConfig.mapLongitude,
  },
  areaServed: [
    { "@type": "City", name: "Kuala Lumpur" },
    { "@type": "State", name: "Selangor" },
    { "@type": "City", name: "Petaling Jaya" },
    { "@type": "City", name: "Cheras" },
    { "@type": "City", name: "Mont Kiara" },
    { "@type": "City", name: "Bangsar" },
    { "@type": "City", name: "Subang Jaya" },
    { "@type": "City", name: "Shah Alam" },
    { "@type": "City", name: "Puchong" },
    { "@type": "City", name: "Kepong" },
    { "@type": "City", name: "Sentul" },
    { "@type": "City", name: "Sri Hartamas" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "$$",
  image: settings.og_image_url || settings.logo_url || siteConfig.ogImage,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Renovation Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Full Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Interior Design" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom Built-In Furniture" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Kitchen Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bathroom Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Office Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Shoplot Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Artistic Wall Coating - Remmers" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Old House Renovation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Permit & Drawing Support" } },
    ],
  },
  sameAs: [
    settings.facebook_url,
    settings.instagram_url,
    settings.tiktok_url,
    settings.xiaohongshu_url,
    settings.linkedin_url,
    ...socialProfileUrls,
  ].filter(Boolean),
  knowsAbout: [
    "renovation", "interior design", "built-in furniture", "kitchen renovation",
    "bathroom renovation", "office renovation", "commercial renovation",
    "artistic wall coating", "Remmers", "Kuala Lumpur renovation",
  ],
});

export const JsonLdOrganization = () => {
  const settings = useSiteSettings();
  return <JsonLdScript data={createOrganizationData(settings)} />;
};

export const JsonLdLocalBusiness = () => {
  const settings = useSiteSettings();
  return <JsonLdScript data={createLocalBusinessData(settings)} />;
};

export const JsonLdFAQ = ({ faqs }: { faqs: { question: string; answer: string }[] }) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return <JsonLdScript data={data} />;
};

export const JsonLdService = ({
  name,
  description,
  areaServed,
}: {
  name: string;
  description: string;
  areaServed?: string;
}) => {
  const settings = useSiteSettings();
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    description,
    provider: {
      "@type": "HomeAndConstructionBusiness",
      name: settings.company_name,
      "@id": `${siteConfig.url}/#localbusiness`,
    },
    areaServed: areaServed || "Kuala Lumpur, Selangor, Malaysia",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/quote`,
      servicePhone: settings.phone_e164,
    },
  };

  return <JsonLdScript data={data} />;
};

export const JsonLdBreadcrumb = ({ items }: { items: { name: string; url: string }[] }) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };

  return <JsonLdScript data={data} />;
};
