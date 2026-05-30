import React from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

/**
 * Lightweight scroll-reveal wrapper component.
 * Wraps children in a div that fades/slides in when scrolled into view.
 */
const Reveal = ({ children, className, delay = 0, direction = "up" }: RevealProps) => {
  const { ref, isVisible } = useScrollReveal();

  const directionStyles = {
    up: "translate-y-8",
    left: "translate-x-4 md:translate-x-8",
    right: "-translate-x-4 md:-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      data-reveal
      data-reveal-direction={direction}
      data-reveal-state={isVisible ? "visible" : "hidden"}
      className={cn(
        "transform-gpu transition-all duration-700 ease-out will-change-transform",
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default Reveal;
