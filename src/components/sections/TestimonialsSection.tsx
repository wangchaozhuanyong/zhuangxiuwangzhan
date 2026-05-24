import { Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { testimonials } from "@/data/siteContent";

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-muted" id="testimonials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">What Our Clients Say</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              Real feedback from homeowners and business clients across Kuala Lumpur and Selangor.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="bg-card border border-border rounded-lg p-6 hover-lift h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-gold" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5 flex-1">
                  "{t.text}"
                </blockquote>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm">{t.client}</p>
                  <p className="text-muted-foreground text-xs">{t.type} · {t.location}</p>
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
