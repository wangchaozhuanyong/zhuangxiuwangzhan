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
  /** If true, cards are left-aligned (default). If false, cards use centered text. */
  alignLeft?: boolean;
  /** Layout mode: "vertical" = icon on top (default), "horizontal" = icon left + content right. */
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
    <div className={`grid ${colClass} items-stretch gap-4 md:gap-5`}>
      {items.map((item, i) => {
        const content = (
          <div
            className={`group luxury-card-muted relative hover-lift h-full transition-colors hover:border-accent/30 ${
              isHorizontal
                ? "flex items-start gap-4 p-5 md:p-6"
                : `p-6 md:p-7 ${alignLeft ? "" : "text-center"}`
            }`}
          >
            <div
              className={`rounded-md border border-border/70 bg-background/75 flex items-center justify-center transition-colors group-hover:border-accent/40 group-hover:bg-accent/10 ${
                isHorizontal
                  ? "w-10 h-10 shrink-0"
                  : `w-12 h-12 mb-4 ${alignLeft ? "" : "mx-auto"}`
              }`}
            >
              <item.icon className="w-5 h-5 text-accent transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className={isHorizontal ? "min-w-0 flex-1 flex flex-col" : ""}>
              <h3 className={`font-display font-semibold text-base md:text-lg group-hover:text-accent transition-colors ${isHorizontal ? "mb-1" : "mb-2"}`}>
                {item.title}
              </h3>
              <p className={`text-muted-foreground text-sm leading-relaxed ${isHorizontal ? "mt-auto" : ""}`}>{item.desc}</p>
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
