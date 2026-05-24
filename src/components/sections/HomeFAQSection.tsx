import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useT } from "@/i18n/useT";

const HomeFAQSection = () => {
  const t = useT();

  const faqs = Array.from({ length: 7 }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }));

  return (
    <section className="section-padding bg-background" id="faq">
      <div className="container-narrow max-w-3xl">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t("faq.title")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              {t("faq.subtitle")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`home-faq-${i}`} className="bg-card rounded-lg border border-border px-4">
                <AccordionTrigger className="text-left font-medium text-sm md:text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={200}>
          <div className="text-center mt-8">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/faq">{t("cta.viewAllFAQ")} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default HomeFAQSection;
