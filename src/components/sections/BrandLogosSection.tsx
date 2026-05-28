import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { getPublishedBrandPartners, type PublishedBrandPartner } from "@/lib/homeContentApi";

import remmersLogo from "@/assets/brands/remmers.png";
import hafeleLogo from "@/assets/brands/hafele.png";
import blumLogo from "@/assets/brands/blum.png";
import nipponLogo from "@/assets/brands/nippon-paint.png";
import boschLogo from "@/assets/brands/bosch.png";
import groheLogo from "@/assets/brands/grohe.png";

const fallbackBrands = [
  { id: "remmers", name: "Remmers", logo_url: remmersLogo },
  { id: "hafele", name: "Häfele", logo_url: hafeleLogo },
  { id: "blum", name: "Blum", logo_url: blumLogo },
  { id: "nippon", name: "Nippon Paint", logo_url: nipponLogo },
  { id: "bosch", name: "Bosch", logo_url: boschLogo },
  { id: "grohe", name: "Grohe", logo_url: groheLogo },
];

const BrandLogosSection = () => {
  const [brands, setBrands] = useState<PublishedBrandPartner[]>(fallbackBrands);

  useEffect(() => {
    void getPublishedBrandPartners().then((items) => {
      if (items.length) setBrands(items);
    });
  }, []);

  return (
    <section className="section-padding-compact bg-muted border-y border-border">
      <div className="container-narrow">
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
              <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                className="h-8 md:h-10 w-auto object-contain"
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
