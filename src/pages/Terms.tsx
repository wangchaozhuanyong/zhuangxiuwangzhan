import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig } from "@/config/site";

const termsCopy = {
  en: {
    metaTitle: "Terms & Conditions | FLASH CAST SDN. BHD.",
    metaDescription: "Terms and conditions for FLASH CAST SDN. BHD. renovation services in Kuala Lumpur, Malaysia.",
    metaKeywords: "terms and conditions, FLASH CAST, renovation terms Malaysia",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Terms & Conditions",
    title: "Terms & Conditions",
    updated: "Last updated: March 2026",
    sections: [
      { title: "1. General", body: "These Terms & Conditions govern the use of this website and the renovation services provided by FLASH CAST SDN. BHD. By using our website or engaging our services, you agree to these terms." },
      { title: "2. Quotations & Pricing", items: ["All quotations are valid for 30 days from the date of issue unless otherwise stated.", "Prices are based on the agreed scope of work. Additional work requested after confirmation may incur extra charges.", "Quotations are estimates; final pricing may vary based on site conditions and material availability."] },
      { title: "3. Payment Terms", items: ["A deposit is required upon project confirmation to secure scheduling.", "Progress payments are due at agreed milestones during the project.", "Final payment is due upon project completion and handover.", "Accepted payment methods include bank transfer, online banking, and cheque."] },
      { title: "4. Project Timeline", body: "Project timelines are estimated and may be affected by material delivery, site access, weather, authority approval, or changes requested by the client. We will communicate anticipated delays promptly." },
      { title: "5. Warranty", body: "FLASH CAST provides workmanship warranty on completed renovation works. Warranty period and coverage vary by project type and will be specified in the project agreement. Material warranties are subject to each manufacturer's terms." },
      { title: "6. Client Responsibilities", items: ["Provide accurate property and project information.", "Ensure site access during agreed working hours.", "Obtain or support necessary approvals from building management or authorities where required.", "Make timely decisions on materials, design, and scope changes."] },
      { title: "7. Cancellation & Refunds", body: "If you wish to cancel a confirmed project, please notify us in writing. Cancellation fees may apply depending on project stage. Materials already ordered or custom-fabricated are non-refundable." },
      { title: "8. Intellectual Property", body: "All design concepts, drawings, and content on this website are the intellectual property of FLASH CAST SDN. BHD. and may not be reproduced without written permission." },
      { title: "9. Limitation of Liability", body: "FLASH CAST SDN. BHD. shall not be liable for indirect, incidental, or consequential damages arising from the use of our services or website. Our total liability is limited to the contract value of the specific project." },
      { title: "10. Governing Law", body: "These terms are governed by the laws of Malaysia. Any disputes shall be subject to the jurisdiction of the courts of Malaysia." },
      { title: "11. Contact", body: "For questions regarding these Terms & Conditions:" },
    ],
  },
  zh: {
    metaTitle: "服务条款 | FLASH CAST SDN. BHD.",
    metaDescription: "FLASH CAST SDN. BHD. 吉隆坡装修服务条款，说明报价、付款、工期、保修和客户责任。",
    metaKeywords: "服务条款, FLASH CAST, 马来西亚装修条款",
    breadcrumbHome: "首页",
    breadcrumbCurrent: "服务条款",
    title: "服务条款",
    updated: "最后更新：2026 年 3 月",
    sections: [
      { title: "1. 一般条款", body: "本服务条款适用于本网站及 FLASH CAST SDN. BHD. 提供的装修服务。使用本网站或委托我们提供服务，即表示你同意本条款。" },
      { title: "2. 报价与价格", items: ["除非另有说明，所有报价自发出日期起有效期为 30 天。", "价格根据双方确认的施工范围制定。确认后新增或变更的项目可能产生额外费用。", "报价为估算，最终价格可能因现场状况和材料供应情况而调整。"] },
      { title: "3. 付款条款", items: ["项目确认后需支付订金，以安排施工档期。", "施工期间需按双方确认的节点支付进度款。", "项目完成并交付时需支付尾款。", "可接受的付款方式包括银行转账、网上银行和支票。"] },
      { title: "4. 项目工期", body: "项目工期为估算时间，可能受材料交付、现场进入、天气、政府或管理处审批，以及客户变更需求影响。如预计延期，我们会及时沟通。" },
      { title: "5. 保修", body: "FLASH CAST 会为已完成的装修工程提供施工保修。保修期限和范围会根据项目类型在项目协议中注明。材料保修则以各材料厂商条款为准。" },
      { title: "6. 客户责任", items: ["提供准确的物业和项目资料。", "在约定工作时间内确保现场可进入施工。", "在需要时取得或配合取得管理处或相关部门批准。", "及时确认材料、设计和施工范围变更。"] },
      { title: "7. 取消与退款", body: "如需取消已确认项目，请以书面方式通知我们。视项目进度可能产生取消费用。已订购或定制生产的材料不予退款。" },
      { title: "8. 知识产权", body: "本网站内容、设计概念和图纸均属于 FLASH CAST SDN. BHD. 的知识产权，未经书面许可不得复制或使用。" },
      { title: "9. 责任限制", body: "FLASH CAST SDN. BHD. 不对使用服务或网站所产生的间接、附带或衍生损失负责。我们的总责任以相关项目合同金额为限。" },
      { title: "10. 适用法律", body: "本条款受马来西亚法律管辖。任何争议均受马来西亚法院管辖。" },
      { title: "11. 联系", body: "如对本服务条款有疑问，请联系：" },
    ],
  },
};

const Terms = () => {
  const { language } = useLanguage();
  const t = termsCopy[language];

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/terms" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/terms" }]} />

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
                  {"body" in section && section.body ? <p className="text-muted-foreground leading-relaxed">{section.body}</p> : null}
                  {"items" in section && section.items ? (
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  {section.title.endsWith("Contact") || section.title.endsWith("联系") ? (
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

export default Terms;
