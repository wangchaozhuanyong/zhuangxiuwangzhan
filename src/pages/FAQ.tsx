import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdBreadcrumb } from "@/components/JsonLd";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import heroImg from "@/assets/hero-faq.jpg";

const faqData = [
  {
    category: "General",
    items: [
      { q: "What renovation services does FLASH CAST provide?", a: "We provide full renovation, interior design, custom built-in furniture, kitchen renovation, bathroom renovation, office renovation, shoplot renovation, artistic wall coating (German Remmers), old house renovation, and permit coordination — all across Kuala Lumpur and Selangor." },
      { q: "Which areas do you serve?", a: "We serve all areas in Kuala Lumpur and Selangor including Mont Kiara, Bangsar, Cheras, Petaling Jaya, Subang Jaya, Shah Alam, Puchong, and surrounding areas." },
      { q: "Is FLASH CAST a registered company?", a: "Yes, FLASH CAST SDN. BHD. is a fully SSM-registered company based in Taman United, Kuala Lumpur." },
    ],
  },
  {
    category: "Process & Pricing",
    items: [
      { q: "How do I get a quotation?", a: "Contact us via WhatsApp, phone, or our online quote form. We'll arrange a free site measurement and provide a detailed itemized quotation — no obligation, no hidden charges." },
      { q: "Do you offer free site measurements?", a: "Yes, we provide free on-site measurements for all projects in KL and Selangor as part of our quotation process." },
      { q: "How long does a typical renovation take?", a: "Most residential renovations take 6-12 weeks. Kitchen projects take 3-5 weeks. Bathroom renovations take 2-3 weeks. Office and shop lot fit-outs take 4-8 weeks. We provide a detailed timeline with milestones." },
      { q: "Do you provide warranty or after-sales support?", a: "Yes. All renovation works come with workmanship warranty. We also provide after-sales support for any issues that arise after handover." },
    ],
  },
  {
    category: "Kitchen & Bathroom",
    items: [
      { q: "How long does a kitchen renovation take?", a: "A typical kitchen renovation takes 3-5 weeks depending on the scope and whether plumbing changes are needed." },
      { q: "Is waterproofing included in bathroom renovation?", a: "Absolutely. We apply multiple layers of waterproof membrane and conduct a 48-hour water test before tiling. Proper waterproofing is the most critical aspect of any bathroom renovation." },
      { q: "Can you install kitchen appliances?", a: "Yes. We integrate ovens, hoods, hobs, dishwashers, and other appliances into the cabinet design." },
    ],
  },
  {
    category: "Custom Built-In & Materials",
    items: [
      { q: "Can you build custom furniture to my exact dimensions?", a: "Yes, all our built-in furniture is made to measure — wardrobes, kitchen cabinets, TV consoles, shoe cabinets, vanities, and more. We tailor everything to fit your space." },
      { q: "What materials do you use for cabinets?", a: "We use melamine, acrylic, solid wood, laminate, and other premium materials. All come with soft-close hardware as standard." },
      { q: "Can I see material samples before committing?", a: "Yes. We encourage clients to view material samples — tiles, boards, countertops, and cabinet finishes — before making a decision." },
    ],
  },
  {
    category: "Commercial & Permits",
    items: [
      { q: "Do you handle renovation permits and approvals?", a: "Yes, we assist with condo management office applications, DBKL permits, local council approvals, drawing coordination, and site inspection scheduling." },
      { q: "Can you renovate my shop or office?", a: "Yes, we handle shop lot renovation, office fit-out, F&B interiors, clinic setup, showroom works, and retail displays for commercial clients across KL and Selangor." },
      { q: "Can you work after business hours for office renovation?", a: "Yes. We can arrange night or weekend work to minimize disruption to your operations." },
    ],
  },
];

const FAQ = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="FAQ | Renovation Questions Kuala Lumpur | FLASH CAST"
        description="Frequently asked questions about renovation services, pricing, materials, custom built-in furniture, and permits in Kuala Lumpur and Selangor by FLASH CAST SDN. BHD."
        keywords="renovation FAQ Malaysia, renovation questions KL, built-in furniture FAQ, renovation permit KL"
        canonicalPath="/faq"
      />
      <JsonLdFAQ faqs={faqData.flatMap(cat => cat.items.map(item => ({ question: item.q, answer: item.a })))} />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="FLASH CAST FAQ" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Help Center</p>
          <h1
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            Frequently Asked Questions
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Common questions about our renovation services, process, pricing, and materials.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          {faqData.map((cat, catIdx) => (
            <Reveal key={cat.category} delay={catIdx * 100}>
              <div className="mb-10">
                <div className="accent-line mb-3" />
                <h2 className="font-display text-xl font-bold mb-4">{cat.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {cat.items.map((item, i) => (
                    <AccordionItem key={i} value={`${cat.category}-${i}`} className="bg-card rounded-lg border border-border px-4">
                      <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <div className="accent-line mx-auto mb-4" style={{ backgroundColor: "hsl(var(--gold))" }} />
            <h2 className="font-display text-3xl font-bold mb-4 text-primary-foreground">Still Have Questions?</h2>
            <p className="text-steel-light mb-6">Reach out to us directly — we're happy to help.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
              <Button
                size="lg"
                className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center"
                asChild
              >
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default FAQ;
