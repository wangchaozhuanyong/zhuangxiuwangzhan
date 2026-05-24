import Reveal from "@/components/Reveal";
import { homepageProcessSteps, homepageProcessIntro } from "@/data/siteContent";

const ProcessSection = () => {
  return (
    <section className="section-padding bg-background" id="process">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Our Renovation Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {homepageProcessIntro}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {homepageProcessSteps.map((step, i) => (
            <Reveal key={step.num} delay={i * 80}>
              <div className="bg-card border border-border rounded-lg p-6 hover-lift h-full">
                <span className="font-display text-3xl font-bold text-gold/30 mb-2 block">{step.num}</span>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
