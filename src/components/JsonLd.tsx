import { siteConfig, socialProfileUrls } from "@/config/site";

interface JsonLdProps {
  type: "LocalBusiness" | "FAQPage" | "Service" | "WebPage";
  data?: Record<string, unknown>;
  faqs?: { question: string; answer: string }[];
}

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  alternateName: "闪铸设计",
  url: siteConfig.url,
  logo: siteConfig.logoUrl,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: siteConfig.phoneE164,
    contactType: "customer service",
    areaServed: "MY",
    availableLanguage: ["English", "Malay", "Chinese"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "94, Jalan Mega Mendung, Taman United",
    addressLocality: "Kuala Lumpur",
    postalCode: "58200",
    addressRegion: "Kuala Lumpur",
    addressCountry: "MY",
  },
  sameAs: socialProfileUrls,
};

const localBusinessData = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${siteConfig.url}/#localbusiness`,
  name: siteConfig.name,
  alternateName: "闪铸设计",
  description:
    "Professional renovation, interior design, custom built-in furniture, kitchen renovation, bathroom renovation, office fit-out, and commercial renovation services in Kuala Lumpur and Selangor, Malaysia. SSM registered company with 10+ years experience and 200+ completed projects.",
  url: siteConfig.url,
  telephone: siteConfig.phoneE164,
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "94, Jalan Mega Mendung, Taman United",
    addressLocality: "Kuala Lumpur",
    postalCode: "58200",
    addressRegion: "Kuala Lumpur",
    addressCountry: "MY",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "3.1100",
    longitude: "101.6800",
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
  image: siteConfig.ogImage,
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
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "86",
    bestRating: "5",
  },
  sameAs: socialProfileUrls,
  knowsAbout: [
    "renovation", "interior design", "built-in furniture", "kitchen renovation",
    "bathroom renovation", "office renovation", "commercial renovation",
    "artistic wall coating", "Remmers", "Kuala Lumpur renovation",
  ],
};

export const JsonLdOrganization = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
  />
);

export const JsonLdLocalBusiness = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
  />
);

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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
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
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    description,
    provider: {
      "@type": "HomeAndConstructionBusiness",
      name: siteConfig.name,
      "@id": `${siteConfig.url}/#localbusiness`,
    },
    areaServed: areaServed || "Kuala Lumpur, Selangor, Malaysia",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/quote`,
      servicePhone: siteConfig.phoneE164,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export const JsonLdWebPage = ({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${siteConfig.url}${url}`,
    isPartOf: {
      "@type": "WebSite",
      name: "FLASH CAST",
      url: siteConfig.url,
    },
    provider: {
      "@type": "HomeAndConstructionBusiness",
      name: siteConfig.name,
      "@id": `${siteConfig.url}/#localbusiness`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};
