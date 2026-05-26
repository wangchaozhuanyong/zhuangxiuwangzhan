import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig } from "@/config/site";

const privacyCopy = {
  en: {
    metaTitle: "Privacy Policy | FLASH CAST SDN. BHD.",
    metaDescription: "FLASH CAST SDN. BHD. privacy policy. How we collect, use, and protect your personal information.",
    metaKeywords: "privacy policy, FLASH CAST, data protection Malaysia",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Privacy Policy",
    title: "Privacy Policy",
    updated: "Last updated: March 2026",
    sections: [
      {
        title: "1. Information We Collect",
        body: "When you contact us via our website, WhatsApp, phone, or email, we may collect the following information:",
        items: ["Name and contact details, including phone number and email address", "Property address and project details", "Budget preferences and renovation requirements", "Photos or documents you share with us", "Website usage data, such as cookies and analytics"],
      },
      {
        title: "2. How We Use Your Information",
        body: "We use your personal information to:",
        items: ["Respond to your enquiries and provide quotations", "Schedule site measurements and consultations", "Manage and deliver renovation projects", "Send project updates and relevant communications", "Improve our website and services"],
      },
      {
        title: "3. Data Protection",
        body: "We take reasonable measures to protect your personal data from unauthorized access, alteration, or disclosure. Your information is stored securely and only accessible by authorized personnel involved in your project.",
      },
      {
        title: "4. Third-Party Sharing",
        body: "We do not sell or rent your personal information to third parties. We may share your information with trusted partners, such as material suppliers or subcontractors, only as necessary to deliver your renovation project and with your consent where required.",
      },
      {
        title: "5. Cookies",
        body: "Our website may use cookies and similar technologies to improve user experience and analyze website traffic. You can control cookie settings through your browser preferences.",
      },
      {
        title: "6. Your Rights",
        body: "Under the Malaysian Personal Data Protection Act 2010 (PDPA), you may request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us.",
      },
      {
        title: "7. Contact Us",
        body: "If you have any questions about this Privacy Policy, please contact us:",
      },
    ],
  },
  zh: {
    metaTitle: "隐私政策 | FLASH CAST SDN. BHD.",
    metaDescription: "FLASH CAST SDN. BHD. 隐私政策，说明我们如何收集、使用和保护你的个人资料。",
    metaKeywords: "隐私政策, FLASH CAST, 马来西亚个人资料保护",
    breadcrumbHome: "首页",
    breadcrumbCurrent: "隐私政策",
    title: "隐私政策",
    updated: "最后更新：2026 年 3 月",
    sections: [
      {
        title: "1. 我们收集的信息",
        body: "当你通过网站、WhatsApp、电话或电邮联系我们时，我们可能会收集以下资料：",
        items: ["姓名与联系方式，包括电话号码和电邮地址", "物业地址与项目资料", "预算偏好与装修需求", "你提供给我们的照片或文件", "网站使用资料，例如 cookies 与分析数据"],
      },
      {
        title: "2. 我们如何使用资料",
        body: "我们会将你的个人资料用于：",
        items: ["回复咨询并提供报价", "安排现场测量与咨询", "管理和执行装修项目", "发送项目进度与相关沟通", "改善网站与服务体验"],
      },
      {
        title: "3. 资料保护",
        body: "我们会采取合理措施保护你的个人资料，避免未经授权的访问、修改或披露。资料会安全保存，并仅限参与项目的授权人员访问。",
      },
      {
        title: "4. 第三方分享",
        body: "我们不会出售或出租你的个人资料。为了完成装修项目，我们可能在必要范围内与可信合作方分享资料，例如材料供应商或分包团队，并在需要时取得你的同意。",
      },
      {
        title: "5. Cookies",
        body: "网站可能使用 cookies 或类似技术，以改善使用体验并分析网站流量。你可以通过浏览器设置管理 cookies。",
      },
      {
        title: "6. 你的权利",
        body: "根据马来西亚个人资料保护法令 2010（PDPA），你可要求查阅、更正或删除个人资料。如需行使相关权利，请联系我们。",
      },
      {
        title: "7. 联系我们",
        body: "如对本隐私政策有任何疑问，请联系：",
      },
    ],
  },
};

const Privacy = () => {
  const { language } = useLanguage();
  const t = privacyCopy[language];

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/privacy" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/privacy" }]} />

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <Reveal>
            <div className="accent-line mb-4 mx-auto" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">{t.title}</h1>
            <p className="text-muted-foreground text-sm text-center mb-10">{t.updated}</p>
          </Reveal>

          <Reveal>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              {t.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-xl font-bold mb-3">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                  {"items" in section && section.items ? (
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  {section.title.endsWith("Contact Us") || section.title.endsWith("联系我们") ? (
                    <div className="bg-muted rounded-lg p-5 mt-3 text-sm text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">FLASH CAST SDN. BHD.</strong></p>
                      <p>94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur</p>
                      <p>Email: {siteConfig.email}</p>
                      <p>Phone: {siteConfig.phoneDisplay}</p>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Privacy;
