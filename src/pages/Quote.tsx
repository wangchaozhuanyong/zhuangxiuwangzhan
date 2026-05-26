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
import { siteConfig, whatsappUrl } from "@/config/site";
import heroImg from "@/assets/hero-quote.jpg";

const projectTypes = [
  { value: "Residential Renovation", en: "Residential Renovation", zh: "住宅装修" },
  { value: "Commercial / Office Fit-Out", en: "Commercial / Office Fit-Out", zh: "商业 / 办公室装修" },
  { value: "Custom Built-In Furniture", en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  { value: "Kitchen Cabinet", en: "Kitchen Cabinet", zh: "厨房橱柜" },
  { value: "Shop Renovation", en: "Shop Renovation", zh: "店铺装修" },
  { value: "Artistic Wall Coating (Remmers)", en: "Artistic Wall Coating (Remmers)", zh: "艺术墙面涂装 (Remmers)" },
  { value: "Exterior / Shopfront Works", en: "Exterior / Shopfront Works", zh: "外墙 / 门面工程" },
  { value: "Warehouse & Shelving", en: "Warehouse & Shelving", zh: "仓储架与仓库工程" },
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
    metaDescription: "向 FLASH CAST SDN. BHD. 索取免费装修报价。服务 Kuala Lumpur 与 Selangor，包含免费现场测量咨询。",
    metaKeywords: "吉隆坡装修报价, 马来西亚装修估价, 雪兰莪装修公司",
    breadcrumbHome: "首页",
    breadcrumbCurrent: "免费报价",
    heroEyebrow: "免费咨询",
    heroTitle: "索取免费装修报价",
    heroText: "告诉我们你的装修需求，我们会整理清楚的分项报价。KL 与 Selangor 项目可安排免费现场测量。",
    heroAlt: "FLASH CAST 免费装修报价咨询",
    formTitle: "告诉我们你的项目需求",
    errorTitle: "提交失败",
    errorText: "请稍后再试，或直接通过 WhatsApp 联系我们。",
    name: "姓名",
    phone: "电话 / WhatsApp",
    email: "电邮",
    optional: "选填",
    projectType: "项目类型",
    budgetRange: "预算范围",
    location: "项目地区",
    propertySize: "空间面积",
    approx: "大约",
    details: "项目详情",
    selectProjectType: "请选择项目类型",
    selectBudgetRange: "请选择预算范围",
    namePlaceholder: "请输入姓名",
    emailPlaceholder: "your@email.com",
    locationPlaceholder: "例如 Mont Kiara, KL",
    sizePlaceholder: "例如 1,200 sqft",
    detailsPlaceholder: "请简单说明要装修的空间、材料偏好、风格、工期或特别需求。",
    photoTitle: "有现场照片？",
    photoText: "提交后可通过",
    photoTextEnd: "发送现场照片，方便我们更准确评估报价。",
    submit: "提交报价需求",
    submitting: "提交中...",
    privacyNote: "我们会在 24 小时内联系你。不骚扰、无强制消费。",
    successTitle: "报价需求已提交！",
    successIntro: "谢谢你",
    successReceived: "我们已经收到你的项目资料。",
    successFollowUp: "团队会在",
    successFollowUpEnd: "内联系你并安排免费现场测量。",
    successProject: "项目：",
    successLocation: "地区：",
    successBudget: "预算：",
    whatsappFast: "通过 WhatsApp 更快联系",
    backHome: "返回首页",
    trustTitle: "你会获得什么",
    trustPoints: [
      "免费现场测量与装修咨询",
      "清楚的分项报价，无隐藏收费",
      "施工前可提供 3D 设计效果参考",
      "SSM 注册公司，并提供施工保固",
    ],
    chatTitle: "想先聊一聊？",
    chatText: "可以直接 WhatsApp 咨询。营业时间内，我们通常会在 30 分钟内回复。",
    whatsappNow: "立即 WhatsApp 咨询",
    contactLabel: "电话 / WhatsApp",
    hours: "周一至周六：9 AM - 6 PM",
    sunday: "周日：预约制",
    office: "Taman United, KL",
    address: siteConfig.shortAddress,
    navServices: "服务项目",
    navProjects: "装修案例",
    navFaq: "常见问题",
    requiredName: "请输入姓名",
    requiredPhone: "请输入电话号码",
    invalidPhone: "请输入有效电话号码",
    invalidEmail: "请输入有效电邮",
    requiredProject: "请选择项目类型",
    requiredLocation: "请输入项目地区",
  },
};

type FormErrors = Partial<Record<string, string>>;

const Quote = () => {
  const { language } = useLanguage();
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
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t.requiredName;
    if (!form.phone.trim()) e.phone = t.requiredPhone;
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) e.phone = t.invalidPhone;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t.invalidEmail;
    if (!form.projectType) e.projectType = t.requiredProject;
    if (!form.location.trim()) e.location = t.requiredLocation;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  if (status === "success") {
    return (
      <main className="pt-16">
        <PageMeta title={t.successTitle} description={t.metaDescription} canonicalPath="/quote" />
        <section className="section-padding bg-background min-h-[70vh] flex items-center">
          <div className="container-narrow max-w-lg mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">{t.successTitle}</h1>
            <p className="text-muted-foreground mb-2">
              {t.successIntro}, <strong className="text-foreground">{form.name}</strong>. {t.successReceived}
            </p>
            <p className="text-muted-foreground mb-8">
              {t.successFollowUp} <strong className="text-foreground">24 hours</strong> {t.successFollowUpEnd}
            </p>
            <div className="bg-card p-5 rounded-lg border border-border mb-8 text-left text-sm space-y-2">
              <p><span className="text-muted-foreground">{t.successProject}</span> <span className="font-medium">{form.projectType}</span></p>
              <p><span className="text-muted-foreground">{t.successLocation}</span> <span className="font-medium">{form.location}</span></p>
              {form.budget && <p><span className="text-muted-foreground">{t.successBudget}</span> <span className="font-medium">{form.budget}</span></p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="btn-press font-semibold h-12 px-8" asChild>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsappFast}
                </a>
              </Button>
              <Button variant="outline" className="btn-press h-12 px-8" asChild>
                <Link to="/">{t.backHome}</Link>
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

      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t.heroAlt} className="w-full h-full object-cover" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>{t.heroEyebrow}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {t.heroTitle}
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {t.heroText}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="bg-card p-6 md:p-8 rounded-lg border border-border">
                <h2 className="font-display text-xl font-bold mb-6">{t.formTitle}</h2>

                {status === "error" && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-destructive">{t.errorTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.errorText}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="btn-press" asChild>
                          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="w-4 h-4 mr-1.5" />
                            {t.whatsappNow}
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="btn-press" asChild>
                          <a href={siteConfig.phoneHref}>
                            <Phone className="w-4 h-4 mr-1.5" />
                            {t.contactLabel}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.name} <span className="text-destructive">*</span></label>
                      <Input
                        required placeholder={t.namePlaceholder} value={form.name}
                        className={errors.name ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                      />
                      <FieldError msg={errors.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.phone} <span className="text-destructive">*</span></label>
                      <Input
                        type="tel" required placeholder={siteConfig.phoneDisplay} value={form.phone}
                        className={errors.phone ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: undefined }); }}
                      />
                      <FieldError msg={errors.phone} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.email} <span className="text-muted-foreground text-xs">({t.optional})</span></label>
                    <Input
                      type="email" placeholder={t.emailPlaceholder} value={form.email}
                      className={errors.email ? "border-destructive" : ""}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                    />
                    <FieldError msg={errors.email} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.projectType} <span className="text-destructive">*</span></label>
                      <select
                        required value={form.projectType}
                        onChange={(e) => { setForm({ ...form, projectType: e.target.value }); setErrors({ ...errors, projectType: undefined }); }}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.projectType ? "border-destructive" : "border-input"}`}
                      >
                        <option value="">{t.selectProjectType}</option>
                        {projectTypes.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                      </select>
                      <FieldError msg={errors.projectType} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.budgetRange} <span className="text-muted-foreground text-xs">({t.optional})</span></label>
                      <select
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">{t.selectBudgetRange}</option>
                        {budgetRanges.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.location} <span className="text-destructive">*</span></label>
                      <Input
                        required placeholder={t.locationPlaceholder} value={form.location}
                        className={errors.location ? "border-destructive" : ""}
                        onChange={(e) => { setForm({ ...form, location: e.target.value }); setErrors({ ...errors, location: undefined }); }}
                      />
                      <FieldError msg={errors.location} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.propertySize} <span className="text-muted-foreground text-xs">({t.approx})</span></label>
                      <Input placeholder={t.sizePlaceholder} value={form.propertySize} onChange={(e) => setForm({ ...form, propertySize: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.details} <span className="text-muted-foreground text-xs">({t.optional})</span></label>
                    <Textarea rows={5} placeholder={t.detailsPlaceholder} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                  </div>
                  <div className="bg-muted rounded-lg p-4 border border-border text-sm text-muted-foreground">
                    <p className="font-medium text-foreground text-xs mb-1">{t.photoTitle}</p>
                    <p className="text-xs">
                      {t.photoText} <a href={whatsappUrl()} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">WhatsApp</a> {t.photoTextEnd}
                    </p>
                  </div>
                  <Button type="submit" size="lg" className="w-full btn-press font-semibold h-12" disabled={status === "submitting"}>
                    {status === "submitting" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.submitting}</>
                    ) : (
                      <>{t.submit} <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{t.privacyNote}</p>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <Reveal>
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="font-display font-semibold text-base mb-4">{t.trustTitle}</h3>
                  <ul className="space-y-3">
                    {t.trustPoints.map((point) => (
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
                  <h3 className="font-display font-semibold text-base mb-4">{t.chatTitle}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{t.chatText}</p>
                  <Button className="w-full btn-press font-semibold h-11" asChild>
                    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsappNow}
                    </a>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{siteConfig.phoneDisplay}</p>
                      <p className="text-xs text-muted-foreground">{t.contactLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t.hours}</p>
                      <p className="text-xs text-muted-foreground">{t.sunday}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t.office}</p>
                      <p className="text-xs text-muted-foreground">{t.address}</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={300}>
                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>
                    <Link to="/services" className="text-accent hover:underline">{t.navServices}</Link>{" / "}
                    <Link to="/projects" className="text-accent hover:underline">{t.navProjects}</Link>{" / "}
                    <Link to="/faq" className="text-accent hover:underline">{t.navFaq}</Link>
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
