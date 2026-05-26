import { FormEvent, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { submitContactLead } from "@/lib/leadApi";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig, whatsappUrl } from "@/config/site";
import heroImg from "@/assets/hero-contact.jpg";

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
  { value: "landed", en: "Landed House Renovation", zh: "排屋 / 独立屋装修" },
  { value: "kitchen", en: "Kitchen Renovation", zh: "厨房装修" },
  { value: "bathroom", en: "Bathroom Renovation", zh: "浴室装修" },
  { value: "office", en: "Office Renovation", zh: "办公室装修" },
  { value: "shoplot", en: "Shoplot / Commercial", zh: "店铺 / 商业空间" },
  { value: "builtin", en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  { value: "old-house", en: "Old House Renovation", zh: "旧屋翻新" },
  { value: "other", en: "Other", zh: "其他" },
];

const locationOptions = [
  { value: "kl-city", en: "KL City Centre", zh: "吉隆坡市中心" },
  { value: "mont-kiara", en: "Mont Kiara / Sri Hartamas", zh: "Mont Kiara / Sri Hartamas" },
  { value: "bangsar", en: "Bangsar / Mid Valley", zh: "Bangsar / Mid Valley" },
  { value: "cheras", en: "Cheras", zh: "Cheras" },
  { value: "kepong", en: "Kepong / Sentul", zh: "Kepong / Sentul" },
  { value: "pj", en: "Petaling Jaya", zh: "Petaling Jaya" },
  { value: "subang", en: "Subang Jaya", zh: "Subang Jaya" },
  { value: "shah-alam", en: "Shah Alam / Setia Alam", zh: "Shah Alam / Setia Alam" },
  { value: "puchong", en: "Puchong", zh: "Puchong" },
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
    addressText: siteConfig.address,
    phoneTitle: "Phone / WhatsApp",
    emailTitle: "Email",
    hoursTitle: "Business Hours",
    hoursText: "Mon - Sat: 9:00 AM - 6:00 PM\nSun: By Appointment",
    servicesTitle: "Our Services",
    quoteCta: "Get a Free Quote",
    whatsappCta: "WhatsApp Us",
    successTitle: "Message Sent!",
    successThanks: "Thank you",
    successText: "We will get back to you within 24 hours.",
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
    responseNote: "We will respond within 24 hours. No spam.",
    mapTitle: "Visit Our Office",
    mapDescription: "Located in Taman United, Kuala Lumpur. Serving KL, Selangor, and the Klang Valley.",
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
    heroText: "准备开始装修项目？欢迎联系 FLASH CAST。我们服务 Kuala Lumpur、Selangor 与 Klang Valley 周边地区。",
    heroAlt: "联系 FLASH CAST 装修公司",
    infoTitle: "联系方式",
    addressTitle: "地址",
    addressText: siteConfig.address,
    phoneTitle: "电话 / WhatsApp",
    emailTitle: "电邮",
    hoursTitle: "营业时间",
    hoursText: "周一至周六：9:00 AM - 6:00 PM\n周日：预约制",
    servicesTitle: "服务项目",
    quoteCta: "获取免费报价",
    whatsappCta: "WhatsApp 咨询",
    successTitle: "信息已发送！",
    successThanks: "谢谢你",
    successText: "我们会在 24 小时内回复你。",
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
    messagePlaceholder: "请告诉我们你的项目类型、面积、工期、预算范围和特别需求。",
    send: "发送信息",
    sending: "发送中...",
    responseNote: "我们会在 24 小时内回复你。不骚扰。",
    mapTitle: "欢迎到访办公室",
    mapDescription: "位于 Kuala Lumpur Taman United，服务 KL、Selangor 与 Klang Valley。",
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

const Contact = () => {
  const { language } = useLanguage();
  const t = copy[language];
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "", location: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t.requiredName;
    if (!form.phone.trim()) e.phone = t.requiredPhone;
    else if (!/^[+]?\d[\d\s-]{6,}$/.test(form.phone.trim())) e.phone = t.invalidPhone;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t.invalidEmail;
    if (!form.message.trim()) e.message = t.requiredMessage;
    else if (form.message.trim().length < 10) e.message = t.shortMessage;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      await submitContactLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        projectType: form.projectType,
        location: form.location,
        message: form.message,
        sourcePath: window.location.pathname,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const contactItems = [
    { icon: MapPin, title: t.addressTitle, text: t.addressText },
    { icon: Phone, title: t.phoneTitle, text: siteConfig.phoneDisplay },
    { icon: Mail, title: t.emailTitle, text: siteConfig.email },
    { icon: Clock, title: t.hoursTitle, text: t.hoursText },
  ];

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/contact" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/contact" }]} />

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl font-bold mb-6">{t.infoTitle}</h2>
                <div className="space-y-5">
                  {contactItems.map((item) => (
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
                  <h3 className="font-semibold text-sm mb-3">{t.servicesTitle}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceItems[language].map((service) => (
                      <div key={service} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {service}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                    <Link to="/quote">{t.quoteCta} <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                  <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsappCta}
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
                      <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-3">
                          <p className="text-sm text-destructive">{t.errorText}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" className="btn-press" asChild>
                              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="w-4 h-4 mr-1.5" />
                                {t.whatsappCta}
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="btn-press" asChild>
                              <a href={siteConfig.phoneHref}>
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
                        <label className="block text-sm font-medium mb-1.5">{t.name} <span className="text-destructive">*</span></label>
                        <Input
                          required placeholder={t.namePlaceholder} value={form.name}
                          className={errors.name ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                        />
                        <FieldError msg={errors.name} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.phone} <span className="text-destructive">*</span></label>
                        <Input
                          type="tel" required placeholder={siteConfig.phoneDisplay} value={form.phone}
                          className={errors.phone ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: undefined }); }}
                        />
                        <FieldError msg={errors.phone} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.email} <span className="text-muted-foreground text-xs">({t.optional})</span></label>
                        <Input
                          type="email" placeholder={t.emailPlaceholder} value={form.email}
                          className={errors.email ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                        />
                        <FieldError msg={errors.email} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{t.projectType}</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.projectType}
                            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                          >
                            <option value="">{t.selectType}</option>
                            {projectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{t.location}</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                          >
                            <option value="">{t.selectArea}</option>
                            {locationOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.message} <span className="text-destructive">*</span></label>
                        <Textarea
                          required rows={4} placeholder={t.messagePlaceholder}
                          value={form.message}
                          className={errors.message ? "border-destructive" : ""}
                          onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: undefined }); }}
                        />
                        <FieldError msg={errors.message} />
                      </div>
                      <Button type="submit" size="lg" className="w-full btn-press font-semibold h-12" disabled={status === "submitting"}>
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

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-8">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{t.mapTitle}</h2>
              <p className="text-muted-foreground text-sm">{t.mapDescription}</p>
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
              title={t.mapFrameTitle}
            />
          </div>
        </div>
      </section>

      <section className="py-8 bg-background border-t border-border">
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
