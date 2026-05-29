/**
 * Icon card grid component.
 * Supports vertical and horizontal layouts.
 */

import { LucideIcon } from "lucide-react";
import Link from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";

interface IconCardItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  link?: string;
}

interface IconCardGridProps {
  items: IconCardItem[];
  columns?: 2 | 3 | 4;
  alignLeft?: boolean;
  layout?: "vertical" | "horizontal";
}

const IconCardGrid = ({ items, columns = 2, alignLeft = true, layout = "vertical" }: IconCardGridProps) => {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const isHorizontal = layout === "horizontal";

  return (
    <div className={`card-grid grid ${colClass} gap-5`}>
      {items.map((item, i) => {
        const content = (
          <div
            className={`group luxury-card-muted relative h-full transition-colors hover:border-accent/30 hover-lift ${
              isHorizontal ? "flex items-start gap-4 p-5 md:p-6" : `p-6 md:p-7 ${alignLeft ? "" : "text-center"}`
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-full border border-accent/20 bg-accent/10 transition-colors group-hover:border-accent/35 ${
                isHorizontal ? "h-11 w-11 shrink-0" : `mb-4 h-12 w-12 ${alignLeft ? "" : "mx-auto"}`
              }`}
            >
              <item.icon className="h-5 w-5 text-gold" />
            </div>
            <div className={isHorizontal ? "flex min-w-0 flex-1 flex-col" : ""}>
              <h3
                className={`heading-safe font-display text-base font-semibold transition-colors group-hover:text-gold md:text-lg ${isHorizontal ? "mb-1" : "mb-2"}`}
              >
                {item.title}
              </h3>
              <p className={`prose-safe text-sm text-muted-foreground ${isHorizontal ? "mt-auto" : ""}`}>{item.desc}</p>
            </div>
          </div>
        );

        return (
          <Reveal key={item.title} delay={i * 80}>
            {item.link ? (
              <Link to={item.link} className="block h-full">
                {content}
              </Link>
            ) : (
              content
            )}
          </Reveal>
        );
      })}
    </div>
  );
};

export default IconCardGrid;
