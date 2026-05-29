import { Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { usePublishedTestimonials } from "@/hooks/usePublishedContent";

const TestimonialsSection = () => {
  const { language } = useLanguage();
  const t = useT();
  const { data: publishedTestimonials } = usePublishedTestimonials(language);
  const items = publishedTestimonials?.filter((item) => item.text && item.client) ?? [];

  if (!items.length) return null;

  return (
    <section className="section-padding bg-muted" id="testimonials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("testimonials.title")}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">{t("testimonials.subtitle")}</p>
          </div>
        </Reveal>

        <div className="card-grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.slice(0, 6).map((item, i) => (
            <Reveal key={item.id || `${item.client}-${i}`} delay={i * 100}>
              <div className="card-equal luxury-card p-6 hover-lift">
                <div className="mb-4 flex gap-0.5" aria-label={`${item.rating || 5} out of 5`}>
                  {[...Array(Math.min(Number(item.rating) || 5, 5))].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <blockquote className="card-equal-body prose-safe mb-5 text-sm before:content-['\201C'] before:text-gold/40 after:content-['\201D'] after:text-gold/40">
                  {item.text}
                </blockquote>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm">{item.client}</p>
                  {[item.type, item.location].filter(Boolean).length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {[item.type, item.location].filter(Boolean).join(" / ")}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
