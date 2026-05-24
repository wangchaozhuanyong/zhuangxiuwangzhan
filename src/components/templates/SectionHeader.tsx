/**
 * Reusable section wrapper with title, description, and accent line.
 */

import Reveal from "@/components/Reveal";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

const SectionHeader = ({ title, description, className = "" }: SectionHeaderProps) => {
  return (
    <Reveal>
      <div className={`text-center mb-10 md:mb-14 ${className}`}>
        <div className="accent-line mx-auto mb-4" />
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{title}</h2>
        {description && (
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">{description}</p>
        )}
      </div>
    </Reveal>
  );
};

export default SectionHeader;
