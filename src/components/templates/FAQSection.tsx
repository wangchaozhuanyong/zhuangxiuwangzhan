/**
 * Reusable FAQ Section component.
 * Renders an accordion list of questions and answers from data.
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Reveal from "@/components/Reveal";

interface FAQSectionProps {
  title?: string;
  description?: string;
  faqs: { q: string; a: string }[];
  className?: string;
}

const FAQSection = ({
  title = "Frequently Asked Questions",
  description,
  faqs,
  className = "section-padding bg-muted",
}: FAQSectionProps) => {
  if (!faqs.length) return null;

  return (
    <section className={className}>
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{title}</h2>
            {description && (
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">{description}</p>
            )}
          </div>
        </Reveal>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <AccordionItem value={`faq-${i}`} className="bg-background border border-border rounded-lg px-5">
                  <AccordionTrigger className="text-left font-semibold text-sm md:text-base py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
