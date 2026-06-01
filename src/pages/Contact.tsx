import { FormEvent, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { submitContactLead } from "@/lib/leadApi";
import { useFormGuard } from "@/hooks/useFormGuard";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";
import HeroBanner from "@/components/blocks/HeroBanner";
import { trackCtaClick, trackEvent } from "@/lib/analytics";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const serviceItems = {
  en: [
    "Interior Renovation",
    "Custom Built-In Furniture",
    "Commercial Renovation",
    "Artistic Wall Coating",
    "Exterior Works",
    "Warehouse & Shelving",
  ],
  zh: [
    "室内装修",
    "定制内嵌家具",
    "商业空间装修",
    "艺术墙面涂装",
    "外墙与门面工程",
    "仓库与货架工程",
  ],
};

const projectTypeOptions = [
  { value: "condo", en: "Condo Renovation", zh: "公寓装修" },
  { value: "landed", en: "Landed House Renovation", zh: "排屋 / 独栋住宅装修" },
  { value: "kitchen", en: "Kitchen Renovation", zh: "厨房装修" },
  { value: "bathroom", en: "Bathroom Renovation", zh: "浴室装修" },
  { value: "office", en: "Office Renovation", zh: "办公室装修" },
  { value: "shoplot", en: "Shoplot / Commercial", zh: "店铺 / 商业空间装修" },
  { value: "builtin", en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  { value: "old-house", en: "Old House Renovation", zh: "老房翻新" },
  { value: "other", en: "Other", zh: "其他" },
];

const locationOptions = [
  { value: "kl-city", en: "KL City Centre", zh: "吉隆坡市中心" },
  { value: "mont-kiara", en: "Mont Kiara / Sri Hartamas", zh: "满家乐 / Sri Hartamas" },
  { value: "bangsar", en: "Bangsar / Mid Valley", zh: "孟沙 / Mid Valley" },
  { value: "cheras", en: "Cheras", zh: "蕉赖" },
  { value: "kepong", en: "Kepong / Sentul", zh: "甲洞 / Sentul" },
  { value: "pj", en: "Petaling Jaya", zh: "八打灵再也" },
  { value: "subang", en: "Subang Jaya", zh: "梳邦再也" },
  { value: "shah-alam", en: "Shah Alam / Setia Alam", zh: "莎阿南 / Setia Alam" },
  { value: "puchong", en: "Puchong", zh: "蒲种" },
  { value: "other", en: "Other", zh: "其他" },
];

const copy = {
  en: {
    metaTitle: "Contact FLASH CAST | Renovation Company Kuala Lumpur",
    metaDescription: "Get in touch with FLASH CAST SDN. BHD. for your renovation project in Kuala Lumpur and Selangor.",
    metaKeywords: "contact renovation company KL, FLASH CAST address, renovation enquiry Kuala Lumpur",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Contact",
    heroEyebrow: "Get In Touch",
    heroTitle: "Contact Us",
    heroText: "Ready to start your renovation project? Get in touch with FLASH CAST. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    heroAlt: "Contact FLASH CAST renovation company",
    infoTitle: "Get In Touch",
    addressTitle: "Address",
    addressText: "",
    phoneTitle: "Phone / WhatsApp",
    emailTitle: "Email",
    hoursTitle: "Business Hours",
    hoursText: "Mon - Sat: 9:00 AM - 6:00 PM\nSun: By Appointment",
    servicesTitle: "Our Services",
    quoteCta: "Get a Free Quote",
    whatsappCta: "WhatsApp Us",
    successTitle: "Message Sent!",
    successThanks: "Thank you",
    successText: "We will review your message and follow up during business hours.",
    sendAnother: "Send Another Message",
    formTitle: "Send Us a Message",
    errorText: "Something went wrong. Please try again or contact us via WhatsApp.",
    name: "Name",
    phone: "Phone / WhatsApp",
    email: "Email",
    optional: "optional",
    projectType: "Project Type",
    location: "Location",
    message: "Message",
    namePlaceholder: "Your full name",
    emailPlaceholder: "your@email.com",
    selectType: "Select type...",
    selectArea: "Select area...",
    messagePlaceholder: "Tell us about your project: property type, approximate size, timeline, budget range, and any specific requirements.",
    send: "Send Message",
    sending: "Sending...",
    responseNote: "We will review your message during business hours. No spam.",
    mapTitle: "Visit Our Office",
    mapDescription: "Office address: 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia.",
    mapFrameTitle: "FLASH CAST office location in Kuala Lumpur",
    navServices: "Our Services",
    navProjects: "Projects",
    navMaterials: "Materials",
    navFaq: "FAQ",
    navAbout: "About Us",
    navBlog: "Blog",
    requiredName: "Please enter your name",
    requiredPhone: "Please enter your phone number",
    invalidPhone: "Please enter a valid phone number",
    invalidEmail: "Please enter a valid email",
    requiredMessage: "Please enter your message",
    shortMessage: "Please provide more details (at least 10 characters)",
  },
  zh: {
    metaTitle: "联系 FLASH CAST | 吉隆坡装修公司",
    metaDescription: "联系 FLASH CAST SDN. BHD. 咨询吉隆坡与雪兰莪住宅、商业空间、厨房、旧屋翻新和定制家具装修。",
    metaKeywords: "联系吉隆坡装修公司, FLASH CAST 地址, 雪兰莪装修咨询",
    breadcrumbHome: "首页",
    breadcrumbCurrent: "联系我们",
    heroEyebrow: "联系我们",
    heroTitle: "联系我们",
    heroText: "准备开始装修项目？欢迎联系 FLASH CAST。我们服务吉隆坡、雪兰莪与巴生谷周边地区。",
    heroAlt: "联系 FLASH CAST 装修公司",
    infoTitle: "联系方式",
    addressTitle: "地址",
    addressText: "",
    phoneTitle: "电话 / WhatsApp",
    emailTitle: "电邮",
    hoursTitle: "营业时间",
    hoursText: "周一至周六：9:00 AM - 6:00 PM\n周日：预约制",
    servicesTitle: "服务项目",
    quoteCta: "获取免费报价",
    whatsappCta: "WhatsApp 联系",
    successTitle: "信息已发送！",
    successThanks: "谢谢您",
    successText: "我们会在营业时间查看信息并跟进。",
    sendAnother: "再发送一条信息",
    formTitle: "发送咨询信息",
    errorText: "提交失败。请稍后再试，或通过 WhatsApp 联系我们。",
    name: "姓名",
    phone: "电话 / WhatsApp",
    email: "电邮",
    optional: "选填",
    projectType: "项目类型",
    location: "地区",
    message: "留言",
    namePlaceholder: "请输入姓名",
    emailPlaceholder: "your@email.com",
    selectType: "请选择类型...",
    selectArea: "请选择地区...",
    messagePlaceholder: "请告诉我们您的项目类型、面积、工期、预算范围和特别需求。",
    send: "发送信息",
    sending: "发送中...",
    responseNote: "我们会在营业时间查看信息并跟进。不骚扰。",
    mapTitle: "欢迎到访办公室",
    mapDescription: "办公室地址：94, Jalan Mega Mendung, Taman United, 58200 吉隆坡，马来西亚。",
    mapFrameTitle: "FLASH CAST 吉隆坡办公室位置",
    navServices: "服务项目",
    navProjects: "装修案例",
    navMaterials: "材料库",
    navFaq: "常见问题",
    navAbout: "关于我们",
    navBlog: "装修博客",
    requiredName: "请输入姓名",
    requiredPhone: "请输入电话号码",
    invalidPhone: "请输入有效电话号码",
    invalidEmail: "请输入有效电邮",
    requiredMessage: "请输入留言内容",
    shortMessage: "请提供更多项目细节（至少 10 个字符）",
  },
};

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
  const t = copy[language];
  const { data: pageContent } = usePublishedSitePage(language, "contact");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.contact);
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "", location: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const formGuard = useFormGuard();
  const [honeypot, setHoneypot] = useState("");

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
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) e.phone = t.invalidPhone;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t.invalidEmail;
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
      trackEvent("contact_form_submit", {
        form_status: "validation_error",
        page_path: window.location.pathname,
      });
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
      trackEvent("contact_form_submit", {
        form_status: "success",
        page_path: window.location.pathname,
        project_type: form.projectType,
        location: form.location,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      trackEvent("contact_form_submit", {
        form_status: "error",
        page_path: window.location.pathname,
        project_type: form.projectType,
        location: form.location,
      });
      setStatus("error");
    }
  };

  const contactItems = [
    { icon: MapPin, title: t.addressTitle, text: settings.address || t.addressText },
    { icon: Phone, title: t.phoneTitle, text: settings.phone_display },
    { icon: Mail, title: t.emailTitle, text: settings.email },
    { icon: Clock, title: t.hoursTitle, text: t.hoursText },
  ];

  const mapAddress = settings.address || t.addressText;
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
                  {contactItems.map((item) => (
                    <div key={item.title} className="group flex items-start gap-4 rounded-card border border-border/80 bg-card p-4 shadow-[0_18px_44px_-38px_rgba(21,18,14,0.38)] hover-lift">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
                        <item.icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-card border border-border/80 bg-card shadow-[0_22px_55px_-42px_rgba(21,18,14,0.38)]">
                  <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                    <h3 className="shrink-0 text-sm font-semibold">{t.servicesTitle}</h3>
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-gold/45 via-border to-transparent min-[460px]:block" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 p-4 min-[460px]:grid-cols-2">
                    {serviceItems[language].map((service) => (
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
                            {projectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
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
                            {locationOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
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

      <section className="section-padding bg-background">
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
