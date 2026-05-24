import { Star, Shield, Users, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { trustStats, testimonials } from "@/data/siteContent";

const TrustSection = () => {
  return (
    <section className="section-padding bg-background" id="trust">
      <div className="container-narrow">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {trustStats.map((item, i) => (
            <Reveal key={item.label} delay={i * 100}>
              <div className="text-center p-5 md:p-6 rounded-lg border border-border bg-card group h-full">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${item.iconClass} transition-transform duration-300 group-hover:scale-110`} />
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{item.value}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{item.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Testimonials */}
        <Reveal delay={200}>
          <div className="mt-12">
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">What Our Clients Say</h2>
              <p className="text-muted-foreground text-sm">Feedback from homeowners and businesses across KL and Selangor.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {testimonials.map((t, i) => (
                <Reveal key={i} delay={250 + i * 100}>
                  <div className="p-5 md:p-6 bg-card rounded-lg border border-border h-full flex flex-col">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-gold fill-gold" />
                      ))}
                    </div>
                    <p className="italic text-foreground text-sm leading-relaxed mb-4 flex-1">
                      "{t.text}"
                    </p>
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium">{t.client}</p>
                      <p className="text-xs text-muted-foreground">{t.type} · {t.location}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Trust badges */}
        <Reveal delay={500}>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="w-4 h-4 text-accent" />
              <span className="font-medium">SSM Registered Company</span>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4 text-accent" />
              <span className="font-medium">In-House Design & Build Team</span>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="font-medium">94, Jalan Mega Mendung, 58200 KL</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default TrustSection;
