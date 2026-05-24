import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";

const GeoSection = () => {
  return (
    <section className="section-padding bg-muted border-t border-border">
      <div className="container-narrow">
        <Reveal>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-center max-w-3xl mx-auto mb-4">
            <strong className="text-foreground">FLASH CAST SDN. BHD.</strong> (闪铸设计) is a professional{" "}
            <strong className="text-foreground">renovation company</strong> based in{" "}
            <strong className="text-foreground">Kuala Lumpur, Malaysia</strong>. We specialize in{" "}
            <Link to="/services/renovation" className="text-accent hover:underline font-medium">interior renovation</Link>,{" "}
            <Link to="/services/builtin" className="text-accent hover:underline font-medium">custom built-in furniture</Link>,{" "}
            <Link to="/services/commercial" className="text-accent hover:underline font-medium">commercial fit-out</Link>,{" "}
            <Link to="/services/artistic-coating" className="text-accent hover:underline font-medium">artistic wall coating (German Remmers)</Link>,{" "}
            and full project management solutions across{" "}
            <Link to="/locations/selangor" className="text-accent hover:underline font-medium">Selangor</Link> and the Klang Valley.
          </p>
          <p className="text-muted-foreground text-xs md:text-sm text-center max-w-2xl mx-auto">
            Serving <Link to="/locations/kuala-lumpur" className="hover:underline text-foreground font-medium">Kuala Lumpur</Link>{" · "}
            <Link to="/locations/petaling-jaya" className="hover:underline text-foreground font-medium">Petaling Jaya</Link>{" · "}
            <Link to="/locations/cheras" className="hover:underline text-foreground font-medium">Cheras</Link>{" · "}
            <Link to="/locations/mont-kiara" className="hover:underline text-foreground font-medium">Mont Kiara</Link>{" · "}
            <Link to="/locations/bangsar" className="hover:underline text-foreground font-medium">Bangsar</Link>{" · "}
            <Link to="/locations/subang-jaya" className="hover:underline text-foreground font-medium">Subang Jaya</Link>{" · "}
            Shah Alam · Puchong · Damansara
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default GeoSection;
