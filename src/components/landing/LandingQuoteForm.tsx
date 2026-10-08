import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFormGuard } from "@/hooks/useFormGuard";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useLanguage } from "@/i18n/LanguageContext";
import { landingPageText } from "@/i18n/landingPageText";
import { interactionText } from "@/i18n/interactionText";
import { trackQuoteFormSubmit } from "@/lib/analytics";
import { submitQuoteRequest } from "@/lib/leadApi";
import { isValidLeadPhone, localizeLeadFormErrors } from "@/lib/leadValidation";
import { preloadTurnstile } from "@/lib/turnstile";

const projectTypes = [
  { value: "Residential Renovation", en: "Residential renovation", zh: "住宅装修" },
  { value: "Commercial / Office Fit-Out", en: "Commercial or office", zh: "商业或办公室装修" },
  { value: "Custom Built-In Furniture", en: "Custom furniture", zh: "定制家具" },
  { value: "Other", en: "Other", zh: "其他" },
] as const;

type LandingQuoteFormProps = {
  landingTitle: string;
};

type FieldErrors = Partial<Record<"name" | "phone" | "projectType" | "location", "formRequired" | "formPhoneInvalid">>;

const fieldIds = {
  name: "landing-quote-name",
  phone: "landing-quote-phone",
  projectType: "landing-quote-project-type",
  location: "landing-quote-location",
} as const;

const LandingQuoteForm = ({ landingTitle }: LandingQuoteFormProps) => {
  const { language } = useLanguage();
  const t = landingPageText[language];
  const formGuard = useFormGuard();
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  const [form, setForm] = useState({ name: "", phone: "", projectType: "", location: "" });
  const currentForm = useRef(form); currentForm.current = form;
  const lastSavedForm = useRef<typeof form | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [errorKeys, setErrors] = useState<FieldErrors>({});
  const errors = localizeLeadFormErrors(errorKeys, t);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  useUnsavedChangesWarning(isSubmitting || status === "submitting"
    || Object.values(form).some((value) => value.trim() !== "") && JSON.stringify(form) !== JSON.stringify(lastSavedForm.current));

  useEffect(() => {
    void preloadTurnstile().catch(() => undefined);
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    const next = { ...currentForm.current, [field]: value };
    currentForm.current = next;
    setForm(next);
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === "error") setStatus("idle");
  };

  const validate = (submitted: typeof form) => {
    const next: FieldErrors = {};
    if (!submitted.name.trim()) next.name = "formRequired";
    if (!submitted.phone.trim()) next.phone = "formRequired";
    else if (!isValidLeadPhone(submitted.phone)) next.phone = "formPhoneInvalid";
    if (!submitted.projectType) next.projectType = "formRequired";
    if (!submitted.location.trim()) next.location = "formRequired";
    setErrors(next);

    const firstError = Object.keys(next)[0] as keyof FieldErrors | undefined;
    if (firstError) {
      const target = document.getElementById(fieldIds[firstError]);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    }
    return Object.keys(next).length === 0;
  };

  const submit = protectSubmission("submit", async () => {
    const submitted = { ...currentForm.current };
    if (status === "submitting" || !validate(submitted)) {
      if (status !== "submitting") trackQuoteFormSubmit("validation_error");
      return;
    }

    setStatus("submitting");
    try {
      await submitQuoteRequest({
        name: submitted.name,
        phone: submitted.phone,
        projectType: submitted.projectType,
        location: submitted.location,
        details: language === "zh" ? `推广页面咨询：${landingTitle}` : `Campaign enquiry: ${landingTitle}`,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        website: honeypot,
        startedAt: formGuard.startedAt,
      });
      trackQuoteFormSubmit("success");
      lastSavedForm.current = submitted;
      setStatus(JSON.stringify(currentForm.current) === JSON.stringify(submitted) ? "success" : "idle");
    } catch {
      trackQuoteFormSubmit("error");
      setStatus("error");
    }
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  if (status === "success") {
    return (
      <section id="landing-quote" className="landing-quote-card landing-quote-card--success" role="status" aria-live="polite">
        <CheckCircle2 aria-hidden="true" />
        <h2>{t.formSuccessTitle}</h2>
        <p>{t.formSuccessText}</p>
      </section>
    );
  }

  return (
    <section id="landing-quote" className="landing-quote-card" aria-labelledby="landing-quote-title">
      <header>
        <h2 id="landing-quote-title">{t.formTitle}</h2>
        <p>{t.formSubtitle}</p>
      </header>

      {status === "error" || (status === "idle" && lastSavedForm.current) ? (
        <p className="landing-quote-card__status" role={status === "error" ? "alert" : "status"}>
          {status === "error" ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {status === "error" ? t.formError : interactionText[language].savedWhileEditing}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="landing-quote-card__field">
          <label htmlFor={fieldIds.name}>{t.formName}</label>
          <Input id={fieldIds.name} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder={t.formNamePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined} />
          {errors.name ? <span id={`${fieldIds.name}-error`} role="alert">{errors.name}</span> : null}
        </div>
        <div className="landing-quote-card__field">
          <label htmlFor={fieldIds.phone}>{t.formPhone}</label>
          <Input id={fieldIds.phone} type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder={t.formPhonePlaceholder} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${fieldIds.phone}-error` : undefined} />
          {errors.phone ? <span id={`${fieldIds.phone}-error`} role="alert">{errors.phone}</span> : null}
        </div>
        <div className="landing-quote-card__field">
          <label htmlFor={fieldIds.projectType}>{t.formProject}</label>
          <select data-ui="select" id={fieldIds.projectType} value={form.projectType} onChange={(event) => updateField("projectType", event.target.value)} aria-invalid={Boolean(errors.projectType)} aria-describedby={errors.projectType ? `${fieldIds.projectType}-error` : undefined}>
            <option value="">{t.formProjectPlaceholder}</option>
            {projectTypes.map((item) => <option key={item.value} value={item.value}>{item[language]}</option>)}
          </select>
          {errors.projectType ? <span id={`${fieldIds.projectType}-error`} role="alert">{errors.projectType}</span> : null}
        </div>
        <div className="landing-quote-card__field">
          <label htmlFor={fieldIds.location}>{t.formLocation}</label>
          <Input id={fieldIds.location} value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder={t.formLocationPlaceholder} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? `${fieldIds.location}-error` : undefined} />
          {errors.location ? <span id={`${fieldIds.location}-error`} role="alert">{errors.location}</span> : null}
        </div>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="landing-quote-website">Website</label>
          <input data-ui="input" id="landing-quote-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        </div>

        <button data-ui="button" data-variant="default" type="submit" className="landing-quote-card__submit" disabled={status === "submitting"} aria-busy={status === "submitting"}>
          {status === "submitting" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          <span>{status === "submitting" ? t.formSubmitting : t.formSubmit}</span>
        </button>
        <p className="landing-quote-card__privacy">{t.formPrivacy}</p>
      </form>
    </section>
  );
};

export default LandingQuoteForm;
