import { FormEvent, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, Phone, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { submitQuoteRequest } from "@/lib/leadApi";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImg from "@/assets/hero-quote.jpg";

const projectTypes = [
  { value: "Residential Renovation", en: "Residential Renovation", zh: "住宅装修" },
  { value: "Commercial / Office Fit-Out", en: "Commercial / Office Fit-Out", zh: "商业 / 办公室装潢" },
  { value: "Custom Built-In Furniture", en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  { value: "Kitchen Cabinet", en: "Kitchen Cabinet", zh: "厨房橱柜" },
  { value: "Shop Renovation", en: "Shop Renovation", zh: "店铺装修" },
  { value: "Artistic Wall Coating (Remmers)", en: "Artistic Wall Coating (Remmers)", zh: "艺术墙面涂装（Remmers）" },
  { value: "Exterior / Shopfront Works", en: "Exterior / Shopfront Works", zh: "外墙 / 门面工程" },
  { value: "Warehouse & Shelving", en: "Warehouse & Shelving", zh: "仓库与货架工程" },
  { value: "Other", en: "Other", zh: "其他" },
];

const budgetRanges = [
  { value: "Below RM 30,000", en: "Below RM 30,000", zh: "RM 30,000 以下" },
  { value: "RM 30,000 - RM 60,000", en: "RM 30,000 - RM 60,000", zh: "RM 30,000 - RM 60,000" },
  { value: "RM 60,000 - RM 100,000", en: "RM 60,000 - RM 100,000", zh: "RM 60,000 - RM 100,000" },
  { value: "RM 100,000 - RM 200,000", en: "RM 100,000 - RM 200,000", zh: "RM 100,000 - RM 200,000" },
  { value: "Above RM 200,000", en: "Above RM 200,000", zh: "RM 200,000 以上" },
  { value: "Not sure yet", en: "Not sure yet", zh: "暂不确定" },
];

const getLocalizedOptionLabel = (options: { value: string; en: string; zh: string }[], value: string, language: "en" | "zh") => {
  const option = options.find((item) => item.value === value);
  if (!option) return value;
  return language === "zh" ? option.zh : option.en;
};

const copy = {
  en: {
    metaTitle: "Get a Free Renovation Quote | Kuala Lumpur & Selangor | FLASH CAST",
    metaDescription: "Request a free renovation quotation from FLASH CAST SDN. BHD. Free site measurement included for Kuala Lumpur and Selangor.",
    metaKeywords: "free renovation quote KL, renovation quotation Malaysia, site measurement Kuala Lumpur",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Get a Quote",
    heroEyebrow: "Free Consultation",
    heroTitle: "Get a Free Quote",
    heroText: "Tell us about your renovation project and we will provide a detailed, itemized quotation. Free site measurement included for KL and Selangor.",
    heroAlt: "Get a free renovation quote from FLASH CAST",
    formTitle: "Tell Us About Your Project",
    errorTitle: "Something went wrong",
    errorText: "Please try again or contact us directly via WhatsApp.",
    name: "Name",
    phone: "Phone / WhatsApp",
    email: "Email",
    optional: "optional",
    projectType: "Project Type",
    budgetRange: "Budget Range",
    location: "Location",
    propertySize: "Property Size",
    approx: "approx.",
    details: "Project Details",
    selectProjectType: "Select project type",
    selectBudgetRange: "Select budget range",
    namePlaceholder: "Your full name",
    emailPlaceholder: "your@email.com",
    locationPlaceholder: "e.g. Mont Kiara, KL",
    sizePlaceholder: "e.g. 1,200 sqft",
    detailsPlaceholder: "Describe your project: rooms to renovate, preferred materials, style, timeline, or any special requirements.",
    photoTitle: "Have site photos?",
    photoText: "After submitting, share your site photos via",
    photoTextEnd: "for a more accurate quotation. Photos help us understand your space better.",
    submit: "Submit Quote Request",
    submitting: "Submitting...",
    privacyNote: "We will contact you within 24 hours. No spam, no obligation.",
    successTitle: "Quote Request Submitted!",
    successIntro: "Thank you",
    successReceived: "We have received your project details.",
    successFollowUp: "Our team will contact you within",
    successFollowUpEnd: "to arrange a free site measurement.",
    successProject: "Project:",
    successLocation: "Location:",
    successBudget: "Budget:",
    whatsappFast: "WhatsApp for Faster Response",
    backHome: "Back to Home",
    trustTitle: "What You Will Get",
    trustPoints: [
      "Free site measurement and consultation",
      "Detailed itemized quotation with no hidden costs",
      "3D design visualization before construction",
      "SSM-registered company with workmanship warranty",
    ],
    chatTitle: "Prefer to Chat?",
    chatText: "Get an instant response via WhatsApp. Our team typically replies within 30 minutes during business hours.",
    whatsappNow: "WhatsApp Us Now",
    contactLabel: "Phone / WhatsApp",
    hours: "Mon - Sat: 9 AM - 6 PM",
    sunday: "Sun: By Appointment",
    office: "Taman United, KL",
    address: siteConfig.shortAddress,
    navServices: "Our Services",
    navProjects: "Projects",
    navFaq: "FAQ",
    requiredName: "Please enter your name",
    requiredPhone: "Please enter your phone number",
    invalidPhone: "Please enter a valid phone number",
    invalidEmail: "Please enter a valid email",
    requiredProject: "Please select a project type",
    requiredLocation: "Please enter your project location",
  },
  zh: {
    metaTitle: "免费装修报价 | 吉隆坡与雪兰莪 | FLASH CAST",
    metaDescription: "向 FLASH CAST SDN. BHD. 申请免费装修报价。吉隆坡与雪兰莪可安排免费上门测量。",
    metaKeywords: "吉隆坡装修报价, 马来西亚装修估价, 免费上门测量, 装修公司",
    breadcrumbHome: "首页",
    breadcrumbCurrent: "获取报价",
    heroEyebrow: "免费咨询",
    heroTitle: "获取免费报价",
    heroText: "告诉我们您的装修需求，我们会提供清晰、分项的报价。吉隆坡与雪兰莪项目可安排免费上门测量。",
    heroAlt: "FLASH CAST 免费装修报价咨询",
    formTitle: "请告诉我们您的项目",
    errorTitle: "提交失败",
    errorText: "请稍后重试，或直接通过 WhatsApp 联系我们。",
    name: "姓名",
    phone: "电话 / WhatsApp",
    email: "邮箱",
    optional: "可选",
    projectType: "项目类型",
    budgetRange: "预算范围",
    location: "项目地点",
    propertySize: "空间面积",
    approx: "大约",
    details: "项目详情",
    selectProjectType: "请选择项目类型",
    selectBudgetRange: "请选择预算范围",
    namePlaceholder: "请输入您的全名",
    emailPlaceholder: "your@email.com",
    locationPlaceholder: "例如 Mont Kiara, KL",
    sizePlaceholder: "例如 1,200 sqft",
    detailsPlaceholder: "请描述您的项目：需要装修的房间、偏好的材料、风格、工期，或其他特殊需求。",
    photoTitle: "有现场照片吗？",
    photoText: "提交后，您可以通过",
    photoTextEnd: "发送现场照片，这样我们能提供更准确的报价。照片有助于我们更了解您的空间。",
    submit: "提交报价请求",
    submitting: "提交中...",
    privacyNote: "我们会在 24 小时内与您联系。无垃圾信息、无强制消费。",
    successTitle: "报价请求已提交！",
    successIntro: "谢谢您",
    successReceived: "我们已经收到您的项目资料。",
    successFollowUp: "我们的团队会在",
    successFollowUpEnd: "内与您联系，安排免费上门测量。",
    successProject: "项目：",
    successLocation: "地点：",
    successBudget: "预算：",
    whatsappFast: "通过 WhatsApp 获取更快回复",
    backHome: "返回首页",
    trustTitle: "您将获得什么",
    trustPoints: [
      "免费上门测量与咨询",
      "清晰分项报价，无隐藏费用",
      "施工前提供 3D 设计效果图",
      "SSM 注册公司，提供施工保固",
    ],
    chatTitle: "想先聊一聊？",
    chatText: "您可以直接通过 WhatsApp 获取即时回复。营业时间内，我们通常会在 30 分钟内回复。",
    whatsappNow: "立即 WhatsApp 咨询",
    contactLabel: "电话 / WhatsApp",
    hours: "周一至周六：上午 9 点至下午 6 点",
    sunday: "周日：预约制",
    office: "Taman United, KL",
    address: siteConfig.shortAddress,
    navServices: "我们的服务",
    navProjects: "装修案例",
    navFaq: "常见问题",
    requiredName: "请输入您的姓名",
    requiredPhone: "请输入您的电话号码",
    invalidPhone: "请输入有效的电话号码",
    invalidEmail: "请输入有效的邮箱",
    requiredProject: "请选择项目类型",
    requiredLocation: "请输入项目地点",
  },
};

type FormErrors = Partial<Record<string, string>>;

const Quote = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    projectType: "",
    location: "",
    propertySize: "",
    budget: "",
    details: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = t.requiredName;
    if (!form.phone.trim()) next.phone = t.requiredPhone;
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) next.phone = t.invalidPhone;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t.invalidEmail;
    if (!form.projectType) next.projectType = t.requiredProject;
    if (!form.location.trim()) next.location = t.requiredLocation;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
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
        sourcePath: window.location.pathname,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main className="pt-16">
        <PageMeta title={t.successTitle} description={t.metaDescription} canonicalPath="/quote" />
        <section className="section-padding flex min-h-[70vh] items-center bg-background">
          <div className="container-narrow mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold">{t.successTitle}</h1>
            <p className="mb-2 text-muted-foreground">
              {t.successIntro}, <strong className="text-foreground">{form.name}</strong>. {t.successReceived}
            </p>
            <p className="mb-2 text-muted-foreground">
              {t.successFollowUp} <strong className="text-foreground">24 小时</strong> {t.successFollowUpEnd}
            </p>

            <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
              <h2 className="mb-4 font-display text-xl font-semibold">{t.whatsappFast}</h2>
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-accent" />
                  {t.contactLabel}: {settings.phone_display}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  {t.office}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-accent" />
                  {t.hours}
                </p>
                <p className="text-sm text-muted-foreground">{t.sunday}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link to="/contact">{t.backHome}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1">
                <a href={settings.whatsapp_url()} target="_blank" rel="noreferrer">
                  <WhatsAppIcon className="mr-2 h-4 w-4" /> {t.whatsappNow}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/quote" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/quote" }]} />

      <section className="relative flex min-h-[45vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t.heroAlt} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 py-20 md:px-8 md:py-28">
          <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: "hsl(var(--gold))" }}>
            {t.heroEyebrow}
          </p>
          <h1 className="mb-4 max-w-lg font-display text-3xl font-bold leading-tight text-white md:text-5xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {t.heroTitle}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/90 md:text-lg" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {t.heroText}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div>
              <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">{t.formTitle}</h2>

              {status === "error" && (
                <div role="alert" aria-live="polite" className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{t.errorTitle}</p>
                    <p className="text-muted-foreground">{t.errorText}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="quote-name" className="mb-1 block text-sm font-medium">{t.name}</label>
                    <Input id="quote-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "quote-name-error" : undefined} />
                    {errors.name && <p id="quote-name-error" role="alert" className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="quote-phone" className="mb-1 block text-sm font-medium">{t.phone}</label>
                    <Input id="quote-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t.contactLabel} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "quote-phone-error" : undefined} />
                    {errors.phone && <p id="quote-phone-error" role="alert" className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="quote-email" className="mb-1 block text-sm font-medium">
                      {t.email} <span className="text-muted-foreground">({t.optional})</span>
                    </label>
                    <Input id="quote-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t.emailPlaceholder} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "quote-email-error" : undefined} />
                    {errors.email && <p id="quote-email-error" role="alert" className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="quote-location" className="mb-1 block text-sm font-medium">{t.location}</label>
                    <Input id="quote-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t.locationPlaceholder} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "quote-location-error" : undefined} />
                    {errors.location && <p id="quote-location-error" role="alert" className="mt-1 text-xs text-destructive">{errors.location}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="quote-project-type" className="mb-1 block text-sm font-medium">{t.projectType}</label>
                    <select
                      id="quote-project-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.projectType}
                      onChange={(e) => setForm({ ...form, projectType: e.target.value })}
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
                    <label htmlFor="quote-budget" className="mb-1 block text-sm font-medium">{t.budgetRange}</label>
                    <select
                      id="quote-budget"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    >
                      <option value="">{t.selectBudgetRange}</option>
                      {budgetRanges.map((item) => (
                        <option key={item.value} value={item.value}>
                          {language === "zh" ? item.zh : item.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="quote-property-size" className="mb-1 block text-sm font-medium">
                    {t.propertySize} <span className="text-muted-foreground">({t.approx})</span>
                  </label>
                  <Input id="quote-property-size" value={form.propertySize} onChange={(e) => setForm({ ...form, propertySize: e.target.value })} placeholder={t.sizePlaceholder} />
                </div>

                <div>
                  <label htmlFor="quote-details" className="mb-1 block text-sm font-medium">{t.details}</label>
                  <Textarea
                    id="quote-details"
                    rows={5}
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    placeholder={t.detailsPlaceholder}
                  />
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">{t.photoTitle}</p>
                  <p>
                    {t.photoText}{" "}
                    <a href={settings.whatsapp_url()} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                      WhatsApp
                    </a>{" "}
                    {t.photoTextEnd}
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full md:w-auto" disabled={status === "submitting"} aria-busy={status === "submitting"}>
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
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold">{t.trustTitle}</h2>
                <ul className="space-y-3">
                  {t.trustPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="mb-3 font-display text-xl font-bold">{t.chatTitle}</h3>
                <p className="mb-5 text-sm text-muted-foreground">{t.chatText}</p>
                <Button asChild className="w-full">
                  <a href={settings.whatsapp_url()} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="mr-2 h-4 w-4" /> {t.whatsappNow}
                  </a>
                </Button>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-3 font-display text-lg font-bold">{t.navServices}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{t.navProjects}</p>
                  <p>{t.navFaq}</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent" />
                    {t.contactLabel}: {settings.phone_display}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Quote;
