import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { serviceAreas, serviceAreaIntro, serviceAreaFooter } from "@/data/siteContent";

const ServiceAreaSection = () => {
  return (
    <section className="section-padding bg-muted" id="service-area">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Service Areas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {serviceAreaIntro}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {serviceAreas.map((area, i) => (
            <Reveal key={area.name} delay={i * 70}>
              <Link
                to={`/locations/${area.slug}`}
                className="group flex items-start gap-3 p-5 md:p-6 bg-background rounded-lg border border-border hover-lift transition-colors hover:border-accent/30"
              >
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold text-base group-hover:text-accent transition-colors mb-1">
                    {area.name}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{area.areas}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              {serviceAreaFooter.text}{" "}
              <Link to={serviceAreaFooter.link} className="text-accent hover:underline font-medium">{serviceAreaFooter.linkText}</Link> {serviceAreaFooter.suffix}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ServiceAreaSection;
