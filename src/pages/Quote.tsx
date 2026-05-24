import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, Phone, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import heroImg from "@/assets/hero-quote.jpg";

const projectTypes = [
  "Residential Renovation",
  "Commercial / Office Fit-Out",
  "Custom Built-In Furniture",
  "Kitchen Cabinet",
  "Shop Renovation",
  "Artistic Wall Coating (Remmers)",
  "Exterior / Shopfront Works",
  "Warehouse & Shelving",
  "Other",
];

const budgetRanges = [
  "Below RM 30,000",
  "RM 30,000 – RM 60,000",
  "RM 60,000 – RM 100,000",
  "RM 100,000 – RM 200,000",
  "Above RM 200,000",
  "Not sure yet",
];

const trustPoints = [
  "Free site measurement & consultation",
  "Detailed itemized quotation — no hidden costs",
  "3D design visualization before construction",
  "SSM-registered company with workmanship warranty",
];

type FormErrors = Partial<Record<string, string>>;

const Quote = () => {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", projectType: "", location: "", propertySize: "", budget: "", details: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.phone.trim()) e.phone = "Please enter your phone number";
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) e.phone = "Please enter a valid phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email";
    if (!form.projectType) e.projectType = "Please select a project type";
    if (!form.location.trim()) e.location = "Please enter your project location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    // Simulate submission (replace with real API)
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
  };

  if (status === "success") {
    return (
      <main className="pt-16">
        <PageMeta title="Quote Request Submitted | FLASH CAST" description="Your renovation quote request has been submitted." canonicalPath="/quote" />
        <section className="section-padding bg-background min-h-[70vh] flex items-center">
          <div className="container-narrow max-w-lg mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Quote Request Submitted!</h1>
            <p className="text-muted-foreground mb-2">Thank you, <strong className="text-foreground">{form.name}</strong>. We've received your project details.</p>
            <p className="text-muted-foreground mb-8">Our team will contact you within <strong className="text-foreground">24 hours</strong> to arrange a free site measurement.</p>
            <div className="bg-card p-5 rounded-lg border border-border mb-8 text-left text-sm space-y-2">
              <p><span className="text-muted-foreground">Project:</span> <span className="font-medium">{form.projectType}</span></p>
              <p><span className="text-muted-foreground">Location:</span> <span className="font-medium">{form.location}</span></p>
              {form.budget && <p><span className="text-muted-foreground">Budget:</span> <span className="font-medium">{form.budget}</span></p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="btn-press font-semibold h-12 px-8" asChild>
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp for Faster Response
                </a>
              </Button>
              <Button variant="outline" className="btn-press h-12 px-8" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  return (
    <main className="pt-16">
      <PageMeta
        title="Get a Free Renovation Quote | Kuala Lumpur & Selangor | FLASH CAST"
        description="Request a free renovation quotation from FLASH CAST SDN. BHD. Free site measurement included for Kuala Lumpur and Selangor."
        keywords="free renovation quote KL, renovation quotation Malaysia, site measurement Kuala Lumpur"
        canonicalPath="/quote"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Get a Quote", url: "/quote" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Get a free renovation quote from FLASH CAST" className="w-full h-full object-cover" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Free Consultation</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            Get a Free Quote
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Tell us about your renovation project and we'll provide a detailed, itemized quotation. Free site measurement included for KL & Selangor.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-card p-6 md:p-8 rounded-lg border border-border">
                <h2 className="font-display text-xl font-bold mb-6">Tell Us About Your Project</h2>

                {status === "error" && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Something went wrong</p>
                      <p className="text-xs text-muted-foreground mt-1">Please try again or contact us directly via WhatsApp.</p>
                    </div>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
                      <Input
                        required placeholder="Your full name" value={form.name}
                        className={errors.name ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                      />
                      <FieldError msg={errors.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone / WhatsApp <span className="text-destructive">*</span></label>
                      <Input
                        type="tel" required placeholder="+60 12-345 6789" value={form.phone}
                        className={errors.phone ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: undefined }); }}
                      />
                      <FieldError msg={errors.phone} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <Input
                      type="email" placeholder="your@email.com" value={form.email}
                      className={errors.email ? "border-destructive" : ""}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                    />
                    <FieldError msg={errors.email} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Project Type <span className="text-destructive">*</span></label>
                      <select
                        required value={form.projectType}
                        onChange={(e) => { setForm({ ...form, projectType: e.target.value }); setErrors({ ...errors, projectType: undefined }); }}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.projectType ? "border-destructive" : "border-input"}`}
                      >
                        <option value="">Select project type</option>
                        {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <FieldError msg={errors.projectType} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Budget Range <span className="text-muted-foreground text-xs">(optional)</span></label>
                      <select
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Location <span className="text-destructive">*</span></label>
                      <Input
                        required placeholder="e.g. Mont Kiara, KL" value={form.location}
                        className={errors.location ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, location: e.target.value }); setErrors({ ...errors, location: undefined }); }}
                      />
                      <FieldError msg={errors.location} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Property Size <span className="text-muted-foreground text-xs">(approx.)</span></label>
                      <Input placeholder="e.g. 1,200 sqft" value={form.propertySize} onChange={(e) => setForm({ ...form, propertySize: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Project Details <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <Textarea rows={5} placeholder="Describe your project — what rooms need renovation? Any specific materials or style preferences? Timeline requirements?" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                  </div>
                  <div>
                    <div className="bg-muted rounded-lg p-4 border border-border text-sm text-muted-foreground">
                      <p className="font-medium text-foreground text-xs mb-1">📷 Have site photos?</p>
                      <p className="text-xs">After submitting, share your site photos via <a href="https://wa.me/60123456789" className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">WhatsApp</a> for a more accurate quotation. Photos help us understand your space better.</p>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full btn-press font-semibold h-12" disabled={status === "submitting"}>
                    {status === "submitting" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      <>Submit Quote Request <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">We'll contact you within 24 hours. No spam, no obligation.</p>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Reveal>
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="font-display font-semibold text-base mb-4">What You'll Get</h3>
                  <ul className="space-y-3">
                    {trustPoints.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="font-display font-semibold text-base mb-4">Prefer to Chat?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Get an instant response via WhatsApp. Our team typically replies within 30 minutes during business hours.
                  </p>
                  <Button className="w-full btn-press font-semibold h-11" asChild>
                    <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us Now
                    </a>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">+60 12-345 6789</p>
                      <p className="text-xs text-muted-foreground">Phone / WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Mon – Sat: 9 AM – 6 PM</p>
                      <p className="text-xs text-muted-foreground">Sun: By Appointment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Taman United, KL</p>
                      <p className="text-xs text-muted-foreground">94, Jalan Mega Mendung, 58200</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={300}>
                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>
                    <Link to="/services" className="text-accent hover:underline">Our Services</Link>{" · "}
                    <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
                    <Link to="/faq" className="text-accent hover:underline">FAQ</Link>
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Quote;
