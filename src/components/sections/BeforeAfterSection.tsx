import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/Reveal";

import beforeKitchen from "@/assets/before-after/before-kitchen.jpg";
import afterKitchen from "@/assets/before-after/after-kitchen.jpg";
import beforeLiving from "@/assets/before-after/before-living.jpg";
import afterLiving from "@/assets/before-after/after-living.jpg";
import beforeBathroom from "@/assets/before-after/before-bathroom.jpg";
import afterBathroom from "@/assets/before-after/after-bathroom.jpg";

const comparisons = [
  {
    before: beforeKitchen,
    after: afterKitchen,
    title: "Kitchen Renovation",
    location: "Mont Kiara, KL",
    desc: "From dated cabinets to a sleek modern kitchen with marble countertops and integrated appliances.",
  },
  {
    before: beforeLiving,
    after: afterLiving,
    title: "Living Room Transformation",
    location: "Damansara Heights, KL",
    desc: "Complete overhaul — new flooring, built-in TV wall, ambient lighting, and premium finishes.",
  },
  {
    before: beforeBathroom,
    after: afterBathroom,
    title: "Bathroom Upgrade",
    location: "Bangsar, KL",
    desc: "From old fixtures to a luxury marble bathroom with rain shower and floating vanity.",
  },
];

const BeforeAfterSlider = ({
  before,
  after,
  alt,
}: {
  before: string;
  after: string;
  alt: string;
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) updatePosition(e.clientX);
  };
  const handleTouchStart = () => { isDragging.current = true; };
  const handleTouchEnd = () => { isDragging.current = false; };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    updatePosition(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-col-resize select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={(e) => updatePosition(e.clientX)}
    >
      {/* After (full) */}
      <img src={after} alt={`After: ${alt}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt={`Before: ${alt}`} className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }} loading="lazy" />
      </div>
      {/* Slider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-foreground -mr-1" />
          <ChevronRight className="w-4 h-4 text-foreground -ml-1" />
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-3 left-3 bg-foreground/80 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">Before</span>
      <span className="absolute top-3 right-3 bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">After</span>
    </div>
  );
};

const BeforeAfterSection = () => {
  return (
    <section className="section-padding bg-background" id="before-after">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">See the Transformation</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              Drag the slider to compare before and after — real projects by FLASH CAST.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisons.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="bg-card rounded-lg border border-border overflow-hidden hover-lift">
                <BeforeAfterSlider before={item.before} after={item.after} alt={item.title} />
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.location}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/projects">View All Projects <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
