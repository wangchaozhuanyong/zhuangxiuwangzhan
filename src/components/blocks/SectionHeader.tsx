/**
 * Standard section header with title, description, and accent line.
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
      <div className={`section-header mx-auto max-w-3xl ${className}`}>
        <div className="accent-line mx-auto mb-4" />
        <h2 className="heading-safe mb-3 font-display text-2xl font-bold md:text-4xl">{title}</h2>
        {description && (
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
        )}
      </div>
    </Reveal>
  );
};

export default SectionHeader;
