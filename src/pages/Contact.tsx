import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import heroImg from "@/assets/hero-contact.jpg";

type FormErrors = Partial<Record<string, string>>;

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "", location: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.phone.trim()) e.phone = "Please enter your phone number";
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) e.phone = "Please enter a valid phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email";
    if (!form.message.trim()) e.message = "Please enter your message";
    else if (form.message.trim().length < 10) e.message = "Please provide more details (at least 10 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  return (
    <main className="pt-16">
      <PageMeta
        title="Contact FLASH CAST | Renovation Company Kuala Lumpur"
        description="Get in touch with FLASH CAST SDN. BHD. for your renovation project in Kuala Lumpur and Selangor."
        keywords="contact renovation company KL, FLASH CAST address, renovation enquiry Kuala Lumpur"
        canonicalPath="/contact"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Contact FLASH CAST renovation company" className="w-full h-full object-cover" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Get In Touch</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            Contact Us
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Ready to start your renovation project? Get in touch with FLASH CAST — we serve Kuala Lumpur, Selangor, and surrounding areas.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl font-bold mb-6">Get In Touch</h2>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, title: "Address", text: "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia" },
                    { icon: Phone, title: "Phone / WhatsApp", text: "+60 12-345 6789" },
                    { icon: Mail, title: "Email", text: "info@flashcast.com.my" },
                    { icon: Clock, title: "Business Hours", text: "Mon – Sat: 9:00 AM – 6:00 PM\nSun: By Appointment" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 group p-4 rounded-lg border border-border hover-lift">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-3">Our Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Interior Renovation",
                      "Custom Built-In Furniture",
                      "Commercial Renovation",
                      "Artistic Wall Coating",
                      "Exterior Works",
                      "Warehouse & Shelving",
                    ].map((s) => (
                      <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                    <Link to="/quote">Get a Free Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                  <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                    <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                    </a>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={150}>
              <div className="bg-card p-6 md:p-8 rounded-lg border border-border">
                {status === "success" ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3">Message Sent!</h2>
                    <p className="text-muted-foreground text-sm mb-2">Thank you, <strong className="text-foreground">{form.name}</strong>.</p>
                    <p className="text-muted-foreground text-sm mb-6">We'll get back to you within 24 hours.</p>
                    <Button variant="outline" className="btn-press" onClick={() => { setStatus("idle"); setForm({ name: "", phone: "", email: "", projectType: "", location: "", message: "" }); }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-6">Send Us a Message</h2>

                    {status === "error" && (
                      <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">Something went wrong. Please try again or contact us via WhatsApp.</p>
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Name <span className="text-destructive">*</span></label>
                        <Input
                          required placeholder="Your full name" value={form.name}
                          className={errors.name ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                        />
                        <FieldError msg={errors.name} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Phone / WhatsApp <span className="text-destructive">*</span></label>
                        <Input
                          type="tel" required placeholder="+60 12-345 6789" value={form.phone}
                          className={errors.phone ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: undefined }); }}
                        />
                        <FieldError msg={errors.phone} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Email <span className="text-muted-foreground text-xs">(optional)</span></label>
                        <Input
                          type="email" placeholder="your@email.com" value={form.email}
                          className={errors.email ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                        />
                        <FieldError msg={errors.email} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Project Type</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.projectType}
                            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                          >
                            <option value="">Select type...</option>
                            <option value="condo">Condo Renovation</option>
                            <option value="landed">Landed House Renovation</option>
                            <option value="kitchen">Kitchen Renovation</option>
                            <option value="bathroom">Bathroom Renovation</option>
                            <option value="office">Office Renovation</option>
                            <option value="shoplot">Shoplot / Commercial</option>
                            <option value="builtin">Custom Built-In Furniture</option>
                            <option value="old-house">Old House Renovation</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Location</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                          >
                            <option value="">Select area...</option>
                            <option value="kl-city">KL City Centre</option>
                            <option value="mont-kiara">Mont Kiara / Sri Hartamas</option>
                            <option value="bangsar">Bangsar / Mid Valley</option>
                            <option value="cheras">Cheras</option>
                            <option value="kepong">Kepong / Sentul</option>
                            <option value="pj">Petaling Jaya</option>
                            <option value="subang">Subang Jaya</option>
                            <option value="shah-alam">Shah Alam / Setia Alam</option>
                            <option value="puchong">Puchong</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Message <span className="text-destructive">*</span></label>
                        <Textarea
                          required rows={4} placeholder="Tell us about your project — property type, approximate size, timeline, budget range, and any specific requirements..."
                          value={form.message}
                          className={errors.message ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: undefined }); }}
                        />
                        <FieldError msg={errors.message} />
                      </div>
                      <Button type="submit" size="lg" className="w-full btn-press font-semibold h-12" disabled={status === "submitting"}>
                        {status === "submitting" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                        ) : (
                          <>Send Message <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">We'll respond within 24 hours. No spam.</p>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-8">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Visit Our Office</h2>
              <p className="text-muted-foreground text-sm">Located in Taman United, Kuala Lumpur — serving KL, Selangor, and the Klang Valley</p>
            </div>
          </Reveal>
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.0!2d101.68!3d3.11!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDYnMzYuMCJOIDEwMcKwNDAnNDguMCJF!5e0!3m2!1sen!2smy!4v1600000000000"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="FLASH CAST office location in Kuala Lumpur"
            />
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">Our Services</Link>{" · "}
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
            <Link to="/materials" className="text-accent hover:underline">Materials</Link>{" · "}
            <Link to="/faq" className="text-accent hover:underline">FAQ</Link>{" · "}
            <Link to="/about" className="text-accent hover:underline">About Us</Link>{" · "}
            <Link to="/blog" className="text-accent hover:underline">Blog</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Contact;
