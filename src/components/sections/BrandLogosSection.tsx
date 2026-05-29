import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { type PublishedBrandPartner } from "@/lib/homeContentApi";
import { usePublishedBrandPartners } from "@/hooks/usePublishedContent";

import remmersLogo from "@/assets/brands/remmers.webp";
import hafeleLogo from "@/assets/brands/hafele.webp";
import blumLogo from "@/assets/brands/blum.webp";
import nipponLogo from "@/assets/brands/nippon-paint.webp";
import boschLogo from "@/assets/brands/bosch.webp";
import groheLogo from "@/assets/brands/grohe.webp";

const fallbackBrands = [
  { id: "remmers", name: "Remmers", logo_url: remmersLogo },
  { id: "hafele", name: "Häfele", logo_url: hafeleLogo },
  { id: "blum", name: "Blum", logo_url: blumLogo },
  { id: "nippon", name: "Nippon Paint", logo_url: nipponLogo },
  { id: "bosch", name: "Bosch", logo_url: boschLogo },
  { id: "grohe", name: "Grohe", logo_url: groheLogo },
];

const BrandLogosSection = () => {
  const { data: publishedBrands } = usePublishedBrandPartners();
  const brands: PublishedBrandPartner[] = publishedBrands?.length ? publishedBrands : fallbackBrands;

  return (
    <section className="bg-muted py-10 md:py-12 lg:py-14 border-y border-border">
      <div className="container-narrow px-5 md:px-8">
        <Reveal>
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mb-8">
            Trusted Brands & Partners We Work With
          </p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 lg:gap-12">
          {brands.map((brand) => (
            <a
              key={brand.id || brand.name}
              href={brand.website_url || undefined}
              target={brand.website_url ? "_blank" : undefined}
              rel={brand.website_url ? "noopener noreferrer" : undefined}
              className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <SmartImage
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                className="h-8 md:h-10 w-auto object-contain"
                width={160}
                height={40}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
