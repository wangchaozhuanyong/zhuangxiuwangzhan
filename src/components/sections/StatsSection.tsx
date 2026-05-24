import Reveal from "@/components/Reveal";
import { trustStats } from "@/data/siteContent";

const StatsSection = () => {
  return (
    <section className="py-12 md:py-16 bg-background border-b border-border" id="trust">
      <div className="container-narrow px-5 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-card border border-border rounded-lg p-6 text-center hover-lift">
                  <div className="flex justify-center mb-3">
                    <Icon className={`w-7 h-7 ${stat.iconClass}`} />
                  </div>
                  <div className="font-display text-2xl md:text-3xl font-bold mb-1">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-sm mb-2">{stat.label}</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{stat.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
