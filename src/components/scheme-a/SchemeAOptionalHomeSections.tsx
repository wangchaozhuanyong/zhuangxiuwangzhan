import SmartImage from "@/components/SmartImage";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";
import { adminContentSyncText } from "@/i18n/adminContentSyncText";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SchemeAOptionalHomeSections({ content }: { content?: PublishedHomeContentBundle }) {
  const { language } = useLanguage();
  const t = adminContentSyncText[language];
  const brands = content?.brandPartners.filter((brand) => brand.name && brand.logo_url) || [];
  const testimonials = content?.testimonials.filter((item) => item.client && item.text) || [];
  return <>
    {content?.brandPartnersEnabled && brands.length > 0 && <section data-home-section="brand_partners" className="scheme-a-home-brands" aria-labelledby="home-brands-title">
      <div className="scheme-a-frame"><header className="scheme-a-heading"><h2 id="home-brands-title">{t.brand_partners}</h2></header>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{brands.map((brand) => <figure key={brand.id} className="flex min-w-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
          <SmartImage src={brand.logo_url} alt={brand.name} width={240} height={120} sizes="(max-width: 639px) 40vw, 220px" loading="lazy" className="h-20 w-full object-contain" />
          <figcaption className="text-center text-sm">{brand.name}</figcaption>
        </figure>)}</div>
      </div>
    </section>}
    {content?.testimonialsEnabled && testimonials.length > 0 && <section data-home-section="testimonials" className="scheme-a-home-testimonials" aria-labelledby="home-testimonials-title">
      <div className="scheme-a-frame"><header className="scheme-a-heading"><h2 id="home-testimonials-title">{t.testimonials}</h2></header>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{testimonials.map((item) => <figure key={item.id} className="min-w-0 rounded-xl border border-border bg-card p-5">
          <blockquote className="whitespace-pre-line break-words">{item.text}</blockquote><figcaption className="mt-4 text-sm text-muted-foreground">{item.client}</figcaption>
        </figure>)}</div>
      </div>
    </section>}
  </>;
}
