import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { submitContactLead } from "@/lib/leadApi";
import { useFormGuard } from "@/hooks/useFormGuard";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";
import HeroBanner from "@/components/blocks/HeroBanner";
import { trackContactFormSubmit, trackCtaClick } from "@/lib/analytics";
import { isValidLeadEmail, isValidLeadPhone } from "@/lib/leadValidation";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { preloadTurnstile } from "@/lib/turnstile";
import { contactLocationOptions, contactPageText, contactProjectTypeOptions, contactServiceItems } from "@/i18n/contactPageText";



type FormErrors = Partial<Record<string, string>>;

const contactFieldIds: Record<string, string> = {
  name: "contact-name",
  phone: "contact-phone",
  email: "contact-email",
  projectType: "contact-project-type",
  location: "contact-location",
  message: "contact-message",
};

const focusFirstContactError = (errors: FormErrors) => {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey || typeof window === "undefined") return;
  window.setTimeout(() => document.getElementById(contactFieldIds[firstKey] || firstKey)?.focus(), 0);
};

const Contact = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = contactPageText[language];
  const { data: pageContent } = usePublishedSitePage(language, "contact");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.contact);
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "", location: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const formGuard = useFormGuard();
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    void preloadTurnstile().catch(() => undefined);
  }, []);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    if (status === "error") setStatus("idle");
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t.requiredName;
    if (!form.phone.trim()) e.phone = t.requiredPhone;
    else if (!isValidLeadPhone(form.phone)) e.phone = t.invalidPhone;
    if (form.email && !isValidLeadEmail(form.email)) e.email = t.invalidEmail;
    if (!form.message.trim()) e.message = t.requiredMessage;
    else if (form.message.trim().length < 10) e.message = t.shortMessage;
    const hasErrors = Object.keys(e).length > 0;
    setErrors(e);
    if (hasErrors) focusFirstContactError(e);
    return !hasErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (!validate()) {
      trackContactFormSubmit("validation_error");
      return;
    }
    setStatus("submitting");
    try {
      await submitContactLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        projectType: form.projectType,
        location: form.location,
        message: form.message,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        website: honeypot,
        startedAt: formGuard.startedAt,
      });
      trackContactFormSubmit("success", {
        project_type: form.projectType,
        location: form.location,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      trackContactFormSubmit("error", {
        project_type: form.projectType,
        location: form.location,
      });
      setStatus("error");
    }
  };

  const mapAddress = settings.address || t.addressText;
  const mapHref =
    settings.map_latitude && settings.map_longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.map_latitude},${settings.map_longitude}`)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;
  const contactItems = [
    { icon: MapPin, title: t.addressTitle, text: mapAddress, href: mapHref, external: true, track: "map" },
    { icon: Phone, title: t.phoneTitle, text: settings.phone_display, href: settings.phone_href, track: "phone" },
    { icon: Mail, title: t.emailTitle, text: settings.email, href: `mailto:${settings.email}`, track: "email" },
    { icon: Clock, title: t.hoursTitle, text: t.hoursText },
  ];

  const mapDescription = mapAddress
    ? language === "zh"
      ? `办公室地址：${mapAddress}`
      : `Office address: ${mapAddress}`
    : t.mapDescription;

  const FieldError = ({ id, msg }: { id: string; msg?: string }) =>
    msg ? (
      <p id={id} role="alert" className="text-destructive text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {msg}
      </p>
    ) : null;

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/contact"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/contact" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.heroEyebrow}
        title={pageContent?.title || t.heroTitle}
        description={pageContent?.description || t.heroText}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div>
                <div className="subpage-local-heading">
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl font-bold">{t.infoTitle}</h2>
                </div>
                <div className="space-y-5">
                  {contactItems.map((item) => {
                    const Icon = item.icon;
                    const content = (
                      <>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
                          <Icon className="h-4 w-4 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                          <p className="text-muted-foreground text-sm whitespace-pre-line">{item.text}</p>
                        </div>
                      </>
                    );

                    return item.href ? (
                      <a
                        key={item.title}
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className="group flex items-start gap-4 rounded-card border border-border/80 bg-card p-4 shadow-[0_18px_44px_-38px_rgba(21,18,14,0.38)] hover-lift"
                        onClick={() => trackCtaClick(item.track, "contact_info_card", { destination: item.track })}
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={item.title} className="group flex items-start gap-4 rounded-card border border-border/80 bg-card p-4 shadow-[0_18px_44px_-38px_rgba(21,18,14,0.38)] hover-lift">
                        {content}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 overflow-hidden rounded-card border border-border/80 bg-card shadow-[0_22px_55px_-42px_rgba(21,18,14,0.38)]">
                  <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                    <h3 className="shrink-0 text-sm font-semibold">{t.servicesTitle}</h3>
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-gold/45 via-border to-transparent min-[460px]:block" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 p-4 min-[460px]:grid-cols-2">
                    {contactServiceItems[language].map((service) => (
                      <div
                        key={service}
                        className="group flex min-h-11 items-center gap-2.5 rounded-lg border border-border/70 bg-background/75 px-3 py-2.5 text-sm font-medium text-foreground/75 shadow-[0_12px_28px_-26px_rgba(21,18,14,0.38)] transition-colors hover:border-gold/35 hover:bg-gold/5 hover:text-foreground"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
                          <CheckCircle className="h-3.5 w-3.5 text-gold" />
                        </span>
                        <span className="leading-snug">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Link
                    to="/quote"
                    className="btn-brand-primary min-h-12 w-full justify-center px-8 sm:w-auto"
                    onClick={() => trackCtaClick("quote", "contact_info", { destination: "/quote" })}
                  >
                    {t.quoteCta} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={settings.whatsapp_url()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brand-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
                    onClick={() => trackCtaClick("whatsapp", "contact_info", { destination: "whatsapp" })}
                  >
                    <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsappCta}
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={150}>
              <div className="subpage-form-panel p-6 md:p-8">
                {status === "success" ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3">{t.successTitle}</h2>
                    <p className="text-muted-foreground text-sm mb-2">{t.successThanks}, <strong className="text-foreground">{form.name}</strong>.</p>
                    <p className="text-muted-foreground text-sm mb-6">{t.successText}</p>
                    <Button variant="outline" className="btn-press" onClick={() => { setStatus("idle"); setForm({ name: "", phone: "", email: "", projectType: "", location: "", message: "" }); }}>
                      {t.sendAnother}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-6">{t.formTitle}</h2>

                    {status === "error" && (
                      <div role="alert" aria-live="polite" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-3">
                          <p className="text-sm text-destructive">{t.errorText}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" className="btn-press" asChild>
                              <a
                                href={settings.whatsapp_url()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackCtaClick("whatsapp", "contact_error", { destination: "whatsapp" })}
                              >
                                <WhatsAppIcon className="w-4 h-4 mr-1.5" />
                                {t.whatsappCta}
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="btn-press" asChild>
                              <a
                                href={settings.phone_href}
                                onClick={() => trackCtaClick("phone", "contact_error", { destination: "phone" })}
                              >
                                <Phone className="w-4 h-4 mr-1.5" />
                                {t.phoneTitle}
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5">{t.name} <span className="text-destructive">*</span></label>
                        <Input
                          id="contact-name"
                          required placeholder={t.namePlaceholder} value={form.name}
                          className={errors.name ? "border-destructive" : ""}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                          onChange={(e) => updateForm("name", e.target.value)}
                        />
                        <FieldError id="contact-name-error" msg={errors.name} />
                      </div>
                      <div>
                        <label htmlFor="contact-phone" className="block text-sm font-medium mb-1.5">{t.phone} <span className="text-destructive">*</span></label>
                        <Input
                          id="contact-phone"
                          type="tel" required placeholder={settings.phone_display} value={form.phone}
                          className={errors.phone ? "border-destructive" : ""}
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                          onChange={(e) => updateForm("phone", e.target.value)}
                        />
                        <FieldError id="contact-phone-error" msg={errors.phone} />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5">{t.email} <span className="text-muted-foreground text-xs">({t.optional})</span></label>
                        <Input
                          id="contact-email"
                          type="email" placeholder={t.emailPlaceholder} value={form.email}
                          className={errors.email ? "border-destructive" : ""}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                          onChange={(e) => updateForm("email", e.target.value)}
                        />
                        <FieldError id="contact-email-error" msg={errors.email} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact-project-type" className="block text-sm font-medium mb-1.5">{t.projectType}</label>
                          <select
                            id="contact-project-type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.projectType}
                            onChange={(e) => updateForm("projectType", e.target.value)}
                          >
                            <option value="">{t.selectType}</option>
                            {contactProjectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="contact-location" className="block text-sm font-medium mb-1.5">{t.location}</label>
                          <select
                            id="contact-location"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.location}
                            onChange={(e) => updateForm("location", e.target.value)}
                          >
                            <option value="">{t.selectArea}</option>
                            {contactLocationOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5">{t.message} <span className="text-destructive">*</span></label>
                        <Textarea
                          id="contact-message"
                          required rows={4} placeholder={t.messagePlaceholder}
                          value={form.message}
                          className={errors.message ? "border-destructive" : ""}
                          aria-invalid={Boolean(errors.message)}
                          aria-describedby={errors.message ? "contact-message-error" : undefined}
                          onChange={(e) => updateForm("message", e.target.value)}
                        />
                        <FieldError id="contact-message-error" msg={errors.message} />
                      </div>
                      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                        <label htmlFor="contact-website">Website</label>
                        <input
                          id="contact-website"
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full btn-press font-semibold h-12" disabled={status === "submitting"} aria-busy={status === "submitting"}>
                        {status === "submitting" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.sending}</>
                        ) : (
                          <>{t.send} <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">{t.responseNote}</p>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding section-padding--continued bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-8">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{t.mapTitle}</h2>
              <p className="text-muted-foreground text-sm">{mapDescription}</p>
            </div>
          </Reveal>
          <GoogleMapEmbed
            title={t.mapFrameTitle}
            addressLabel={mapAddress}
            latitude={settings.map_latitude}
            longitude={settings.map_longitude}
            height={390}
          />
        </div>
      </section>

      <section className="subpage-link-band py-8">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.navServices}</Link>{" / "}
            <Link to="/projects" className="text-accent hover:underline">{t.navProjects}</Link>{" / "}
            <Link to="/materials" className="text-accent hover:underline">{t.navMaterials}</Link>{" / "}
            <Link to="/faq" className="text-accent hover:underline">{t.navFaq}</Link>{" / "}
            <Link to="/about" className="text-accent hover:underline">{t.navAbout}</Link>{" / "}
            <Link to="/blog" className="text-accent hover:underline">{t.navBlog}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Contact;
