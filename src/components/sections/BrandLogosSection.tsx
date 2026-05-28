import Reveal from "@/components/Reveal";

import remmersLogo from "@/assets/brands/remmers.png";
import hafeleLogo from "@/assets/brands/hafele.png";
import blumLogo from "@/assets/brands/blum.png";
import nipponLogo from "@/assets/brands/nippon-paint.png";
import boschLogo from "@/assets/brands/bosch.png";
import groheLogo from "@/assets/brands/grohe.png";

const brands = [
  { name: "Remmers", logo: remmersLogo },
  { name: "Häfele", logo: hafeleLogo },
  { name: "Blum", logo: blumLogo },
  { name: "Nippon Paint", logo: nipponLogo },
  { name: "Bosch", logo: boschLogo },
  { name: "Grohe", logo: groheLogo },
];

const BrandLogosSection = () => {
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
            <div
              key={brand.name}
              className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className="h-8 md:h-10 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
