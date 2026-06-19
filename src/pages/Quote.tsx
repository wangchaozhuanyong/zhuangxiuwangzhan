import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LocalizedLink from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, Phone, Clock, MapPin, Loader2, AlertCircle, Images, HelpCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { submitQuoteRequest } from "@/lib/leadApi";
import { useFormGuard } from "@/hooks/useFormGuard";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";
import HeroBanner from "@/components/blocks/HeroBanner";
import { trackCtaClick, trackQuoteFormSubmit } from "@/lib/analytics";
import { isValidLeadEmail, isValidLeadPhone } from "@/lib/leadValidation";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { formatQuoteContextLabel, parseQuoteContext } from "@/lib/quoteContext";
import { preloadTurnstile } from "@/lib/turnstile";
import { quotePageText } from "@/i18n/quotePageText";

const projectTypes = [
  { value: "Residential Renovation", en: "Residential Renovation", zh: "住宅装修" },
  { value: "Commercial / Office Fit-Out", en: "Commercial / Office Fit-Out", zh: "商业 / 办公室装修" },
  { value: "Office Renovation", en: "Office Renovation", zh: "办公室装修" },
  { value: "Custom Built-In Furniture", en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  { value: "Kitchen Cabinet", en: "Kitchen Cabinet", zh: "厨房橱柜" },
  { value: "Bathroom Renovation", en: "Bathroom Renovation", zh: "浴室装修" },
  { value: "Shop Renovation", en: "Shop Renovation", zh: "店铺装修" },
  { value: "Old House Renovation", en: "Old House Renovation", zh: "老房翻新" },
  { value: "Artistic Wall / Coating", en: "Artistic Wall / Coating", zh: "艺术墙面涂装" },
  { value: "Exterior Works", en: "Exterior / Shopfront Works", zh: "外墙 / 门面工程" },
  { value: "Warehouse & Shelving", en: "Warehouse & Shelving", zh: "仓库与货架工程" },
  { value: "Other", en: "Other", zh: "其他" },
];

const budgetRanges = [
  { value: "Below RM 30,000", en: "Below RM 30,000", zh: "RM 30,000 以下" },
  { value: "RM 30,000 - RM 60,000", en: "RM 30,000 - RM 60,000", zh: "RM 30,000 - RM 60,000" },
  { value: "RM 60,000 - RM 100,000", en: "RM 60,000 - RM 100,000", zh: "RM 60,000 - RM 100,000" },
  { value: "RM 100,000 - RM 200,000", en: "RM 100,000 - RM 200,000", zh: "RM 100,000 - RM 200,000" },
  { value: "Above RM 200,000", en: "Above RM 200,000", zh: "RM 200,000 以上" },
  { value: "Not sure yet", en: "Not sure yet", zh: "暂时不确定" },
];

const getLocalizedOptionLabel = (options: { value: string; en: string; zh: string }[], value: string, language: "en" | "zh") => {
  const option = options.find((item) => item.value === value);
  if (!option) return value;
  return language === "zh" ? option.zh : option.en;
};

const formatQuoteText = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);

type FormErrors = Partial<Record<string, string>>;

const quoteFieldIds: Record<string, string> = {
  name: "quote-name",
  phone: "quote-phone",
  email: "quote-email",
  projectType: "quote-project-type",
  location: "quote-location",
  budget: "quote-budget",
  propertySize: "quote-property-size",
  details: "quote-details",
};

const focusFirstQuoteError = (errors: FormErrors) => {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey || typeof window === "undefined") return;
  window.setTimeout(() => document.getElementById(quoteFieldIds[firstKey] || firstKey)?.focus(), 0);
};

const Quote = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const settings = useSiteSettings();
  const t = quotePageText[language];
  const quoteContext = useMemo(() => parseQuoteContext(searchParams, language), [language, searchParams]);
  const previousQuoteContextRef = useRef(quoteContext);
  const contextLabel = formatQuoteContextLabel(quoteContext, language);
  const { data: pageContent } = usePublishedSitePage(language, "quote");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.quote);
  const officeAddress = settings.short_address || settings.address || t.office;
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    projectType: quoteContext.projectType,
    location: quoteContext.location,
    propertySize: "",
    budget: "",
    details: quoteContext.details,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const formGuard = useFormGuard();
  const [honeypot, setHoneypot] = useState("");
  const requiredCompletion = useMemo(
    () => ({
      contact: Boolean(form.name.trim() && form.phone.trim()),
      project: Boolean(form.projectType && form.location.trim()),
      details: Boolean(form.budget || form.propertySize.trim() || form.details.trim()),
      done: [form.name.trim(), form.phone.trim(), form.projectType, form.location.trim()].filter(Boolean).length,
      total: 4,
    }),
    [form.budget, form.details, form.location, form.name, form.phone, form.projectType, form.propertySize],
  );
  const formStepCompletion = [requiredCompletion.contact, requiredCompletion.project, requiredCompletion.details];

  useEffect(() => {
    void preloadTurnstile().catch(() => undefined);
  }, []);

  useEffect(() => {
    const previous = previousQuoteContextRef.current;

    setForm((current) => {
      return {
        ...current,
        projectType: current.projectType === previous.projectType ? quoteContext.projectType : current.projectType,
        location: current.location === previous.location ? quoteContext.location : current.location,
        details: current.details === previous.details ? quoteContext.details : current.details,
      };
    });

    previousQuoteContextRef.current = quoteContext;
  }, [quoteContext]);

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
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = t.requiredName;
    if (!form.phone.trim()) next.phone = t.requiredPhone;
    else if (!isValidLeadPhone(form.phone)) next.phone = t.invalidPhone;
    if (form.email && !isValidLeadEmail(form.email)) next.email = t.invalidEmail;
    if (!form.projectType) next.projectType = t.requiredProject;
    if (!form.location.trim()) next.location = t.requiredLocation;
    const hasErrors = Object.keys(next).length > 0;
    setErrors(next);
    if (hasErrors) focusFirstQuoteError(next);
    return !hasErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;
    if (!validate()) {
      trackQuoteFormSubmit("validation_error");
      return;
    }
    setStatus("submitting");

    try {
      await submitQuoteRequest({
        name: form.name,
        phone: form.phone,
        email: form.email,
        projectType: form.projectType,
        location: form.location,
        propertySize: form.propertySize,
        budget: form.budget,
        details: form.details,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        website: honeypot,
        startedAt: formGuard.startedAt,
      });
      trackQuoteFormSubmit("success", {
        project_type: form.projectType,
        budget_range: form.budget,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      trackQuoteFormSubmit("error", {
        project_type: form.projectType,
        budget_range: form.budget,
      });
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main className="pt-site-header">
        <PageMeta title={t.successTitle} description={pageContent?.seo_description || t.metaDescription} canonicalPath="/quote" />
        <section className="section-padding flex min-h-[70vh] items-center bg-background">
          <div className="container-narrow mx-auto max-w-xl text-center">
            <div className="subpage-form-panel p-6 md:p-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
                <CheckCircle className="h-8 w-8 text-gold" />
              </div>
              <h1 className="mb-4 font-display text-3xl font-bold">{t.successTitle}</h1>
              <p className="mb-2 text-muted-foreground">
                {t.successIntro}, <strong className="text-foreground">{form.name}</strong>. {t.successReceived}
              </p>
              <p className="mb-6 text-muted-foreground">
                {t.successFollowUp} <strong className="text-foreground">{t.successFollowUpHours}</strong> {t.successFollowUpEnd}
              </p>

              <div className="luxury-card-muted p-5 text-left">
                <h2 className="mb-4 font-display text-xl font-semibold">{t.whatsappFast}</h2>
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-accent" />
                    {t.contactLabel}: {settings.phone_display}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-accent" />
                    {officeAddress}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-accent" />
                    {t.hours}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.sunday}</p>
                  {form.projectType ? <p className="text-sm text-muted-foreground">{t.successProject} {getLocalizedOptionLabel(projectTypes, form.projectType, language)}</p> : null}
                  {form.location ? <p className="text-sm text-muted-foreground">{t.successLocation} {form.location}</p> : null}
                  {form.budget ? <p className="text-sm text-muted-foreground">{t.successBudget} {getLocalizedOptionLabel(budgetRanges, form.budget, language)}</p> : null}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="btn-brand-primary flex-1">
                  <LocalizedLink to="/">{t.backHome}</LocalizedLink>
                </Button>
                <Button asChild size="lg" variant="outline" className="btn-brand-secondary flex-1">
                  <a
                    href={settings.whatsapp_url()}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackCtaClick("whatsapp", "quote_success", { destination: "whatsapp" })}
                  >
                    <WhatsAppIcon className="mr-2 h-4 w-4" /> {t.whatsappNow}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/quote"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/quote" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.heroEyebrow}
        title={pageContent?.title || t.heroTitle}
        description={pageContent?.description || t.heroText}
      />

      <section className="section-padding bg-background pb-24 md:pb-28">
        <div className="container-narrow grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="subpage-form-panel p-5 md:p-8">
              <div className="subpage-local-heading">
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl font-bold md:text-3xl">{t.formTitle}</h2>
              </div>

              <div className="quote-form-guide" aria-live="polite">
                <div className="quote-form-guide__summary">
                  <span>{t.formTime}</span>
                  <span>{formatQuoteText(t.formProgress, { done: String(requiredCompletion.done), total: String(requiredCompletion.total) })}</span>
                </div>
                <p className="quote-form-guide__text">{t.formGuideText}</p>
                <ol className="quote-form-steps" aria-label={t.formTitle}>
                  {t.formSteps.map((step, index) => (
                    <li key={step} className="quote-form-steps__item" data-complete={formStepCompletion[index] ? "true" : "false"}>
                      <span className="quote-form-steps__marker" aria-hidden="true">
                        {formStepCompletion[index] ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {status === "error" && (
                <div role="alert" aria-live="polite" className="mb-6 flex items-start gap-3 rounded-card border border-destructive/20 bg-destructive/5 p-4 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{t.errorTitle}</p>
                    <p className="text-muted-foreground">{t.errorText}</p>
                  </div>
                </div>
              )}

              {contextLabel && (
                <div className="mb-6 rounded-card border border-accent/20 bg-accent/5 p-4 text-sm">
                  <p className="font-medium text-foreground">{contextLabel}</p>
                  <p className="mt-1 text-muted-foreground">{t.contextNotice}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="quote-form-section-label">
                  <span>1</span>
                  {t.contactSection}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="quote-name" className="mb-1.5 block text-sm">{t.name}</label>
                    <Input id="quote-name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder={t.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "quote-name-error" : undefined} />
                    {errors.name && <p id="quote-name-error" role="alert" className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="quote-phone" className="mb-1.5 block text-sm">{t.phone}</label>
                    <Input id="quote-phone" type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder={t.contactLabel} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "quote-phone-error" : undefined} />
                    {errors.phone && <p id="quote-phone-error" role="alert" className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label htmlFor="quote-email" className="mb-1.5 block text-sm">
                      {t.email} <span className="text-muted-foreground">({t.optional})</span>
                    </label>
                    <Input id="quote-email" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder={t.emailPlaceholder} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "quote-email-error" : undefined} />
                    {errors.email && <p id="quote-email-error" role="alert" className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>

                <div className="quote-form-section-label">
                  <span>2</span>
                  {t.projectSection}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="quote-project-type" className="mb-1.5 block text-sm">{t.projectType}</label>
                    <select
                      id="quote-project-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.projectType}
                      onChange={(e) => updateForm("projectType", e.target.value)}
                      aria-invalid={Boolean(errors.projectType)}
                      aria-describedby={errors.projectType ? "quote-project-type-error" : undefined}
                    >
                      <option value="">{t.selectProjectType}</option>
                      {projectTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {language === "zh" ? item.zh : item.en}
                        </option>
                      ))}
                    </select>
                    {errors.projectType && <p id="quote-project-type-error" role="alert" className="mt-1 text-xs text-destructive">{errors.projectType}</p>}
                  </div>
                  <div>
                    <label htmlFor="quote-location" className="mb-1.5 block text-sm">{t.location}</label>
                    <Input id="quote-location" value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder={t.locationPlaceholder} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "quote-location-error" : undefined} />
                    {errors.location && <p id="quote-location-error" role="alert" className="mt-1 text-xs text-destructive">{errors.location}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="quote-budget" className="mb-1.5 block text-sm">{t.budgetRange}</label>
                  <select
                    id="quote-budget"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.budget}
                    onChange={(e) => updateForm("budget", e.target.value)}
                  >
                    <option value="">{t.selectBudgetRange}</option>
                    {budgetRanges.map((item) => (
                      <option key={item.value} value={item.value}>
                        {language === "zh" ? item.zh : item.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quote-form-section-label">
                  <span>3</span>
                  {t.detailsSection}
                </div>
                <div>
                  <label htmlFor="quote-property-size" className="mb-1.5 block text-sm">
                    {t.propertySize} <span className="text-muted-foreground">({t.approx})</span>
                  </label>
                  <Input id="quote-property-size" value={form.propertySize} onChange={(e) => updateForm("propertySize", e.target.value)} placeholder={t.sizePlaceholder} />
                </div>

                <div>
                  <label htmlFor="quote-details" className="mb-1.5 block text-sm">{t.details}</label>
                  <Textarea
                    id="quote-details"
                    rows={5}
                    value={form.details}
                    onChange={(e) => updateForm("details", e.target.value)}
                    placeholder={t.detailsPlaceholder}
                  />
                </div>

                <div className="luxury-card-muted p-4 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">{t.photoTitle}</p>
                  <p>
                    {t.photoText}{" "}
                    <a
                      href={settings.whatsapp_url()}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent hover:underline"
                      onClick={() => trackCtaClick("whatsapp", "quote_photo_hint", { destination: "whatsapp" })}
                    >
                      WhatsApp
                    </a>{" "}
                    {t.photoTextEnd}
                  </p>
                </div>

                <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="quote-website">Website</label>
                  <input
                    id="quote-website"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="btn-brand-primary h-12 w-full md:w-auto" disabled={status === "submitting"} aria-busy={status === "submitting"}>
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.submitting}
                      </>
                    ) : (
                      <>
                        {t.submit} <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">{t.privacyNote}</p>
                </div>
              </form>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="lg:sticky lg:top-24">
              <div className="subpage-side-panel subpage-side-panel--centered p-6">
                <h2 className="mb-4 font-display text-2xl font-bold">{t.trustTitle}</h2>
                <ul className="subpage-copy-list">
                  {t.trustPoints.map((point) => (
                    <li key={point} className="subpage-copy-item">
                      <span className="subpage-copy-icon">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="subpage-copy-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="subpage-side-panel subpage-side-panel--centered mt-6 p-6">
                <h3 className="mb-3 font-display text-xl font-bold">{t.chatTitle}</h3>
                <p className="mb-5 text-sm text-muted-foreground">{t.chatText}</p>
                <Button asChild className="btn-brand-primary w-full">
                  <a
                    href={settings.whatsapp_url()}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackCtaClick("whatsapp", "quote_sidebar", { destination: "whatsapp" })}
                  >
                    <WhatsAppIcon className="mr-2 h-4 w-4" /> {t.whatsappNow}
                  </a>
                </Button>
              </div>

              <div className="subpage-side-panel subpage-side-panel--centered mt-6 p-6">
                <h3 className="mb-3 font-display text-lg font-bold">{t.navServices}</h3>
                <nav className="quote-side-nav" aria-label={t.navServices}>
                  <LocalizedLink
                    to="/projects"
                    className="quote-side-nav__link"
                    onClick={() => trackCtaClick("navigation", "quote_sidebar_projects", { destination: "/projects" })}
                  >
                    <span className="quote-side-nav__icon">
                      <Images className="h-4 w-4" />
                    </span>
                    <span className="quote-side-nav__copy">
                      <span className="quote-side-nav__title">{t.navProjects}</span>
                      <span className="quote-side-nav__hint">{t.navProjectsHint}</span>
                    </span>
                    <ArrowRight className="quote-side-nav__arrow h-4 w-4" />
                  </LocalizedLink>
                  <LocalizedLink
                    to="/faq"
                    className="quote-side-nav__link"
                    onClick={() => trackCtaClick("navigation", "quote_sidebar_faq", { destination: "/faq" })}
                  >
                    <span className="quote-side-nav__icon">
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <span className="quote-side-nav__copy">
                      <span className="quote-side-nav__title">{t.navFaq}</span>
                      <span className="quote-side-nav__hint">{t.navFaqHint}</span>
                    </span>
                    <ArrowRight className="quote-side-nav__arrow h-4 w-4" />
                  </LocalizedLink>
                  <a
                    href={settings.phone_href}
                    className="quote-side-nav__link"
                    onClick={() => trackCtaClick("phone", "quote_sidebar_phone", { destination: "tel" })}
                  >
                    <span className="quote-side-nav__icon">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="quote-side-nav__copy">
                      <span className="quote-side-nav__title">{t.navPhoneTitle}</span>
                      <span className="quote-side-nav__hint">{settings.phone_display}</span>
                    </span>
                    <ArrowRight className="quote-side-nav__arrow h-4 w-4" />
                  </a>
                </nav>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Quote;
