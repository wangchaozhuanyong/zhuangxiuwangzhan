import { useMemo } from "react";
import { Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { translateDisplayText } from "@/i18n/displayLabels";
import { usePublishedTestimonials } from "@/hooks/usePublishedContent";

const fallbackTestimonials = {
  en: [
    {
      text: "Very responsive team and solid workmanship. The project was delivered on time and the final result looks clean and premium. The quotation was transparent with no hidden costs.",
      client: "Mr. Tan",
      location: "Mont Kiara, KL",
      type: "Condo Renovation",
    },
    {
      text: "Good communication throughout the renovation process. The site supervisor was always available and the weekly photo updates gave us confidence. The final result matches the 3D design perfectly.",
      client: "Ms. Lee",
      location: "Petaling Jaya",
      type: "Office Fit-Out",
    },
    {
      text: "We chose FLASH CAST for our kitchen renovation. The cabinet quality is excellent, soft-close hardware works perfectly, and the countertop installation was precise. Will use them again for our bedroom.",
      client: "Mr. & Mrs. Wong",
      location: "Bangsar, KL",
      type: "Kitchen Renovation",
    },
    {
      text: "Our old landed house needed rewiring, plumbing and a full interior refresh. FLASH CAST explained every stage clearly and solved site issues without pushing unnecessary upgrades.",
      client: "Mr. Lim",
      location: "Cheras, KL",
      type: "Old House Renovation",
    },
    {
      text: "They handled our shop renovation from layout planning to final touch-up. The team understood our opening deadline and coordinated the trades well, so we could start business on schedule.",
      client: "Ms. Aisha",
      location: "Subang Jaya",
      type: "Shoplot Renovation",
    },
    {
      text: "The built-in wardrobe and storage work made our unit much more practical. Measurements were accurate, finishing was neat, and the team kept the site clean before handover.",
      client: "Mr. Chan",
      location: "Puchong",
      type: "Custom Built-In Furniture",
    },
  ],
  zh: [
    {
      text: "团队响应很快，施工品质也很稳定。项目按时交付，最终效果整洁又有质感，报价清楚，没有隐藏费用。",
      client: "Tan 先生",
      location: "Mont Kiara, KL",
      type: "公寓装修",
    },
    {
      text: "装修过程中沟通顺畅，工地主管也随时都在，周报照片让我们很放心。最终成品和 3D 设计几乎一模一样。",
      client: "Lee 女士",
      location: "Petaling Jaya",
      type: "办公室装修",
    },
    {
      text: "厨房翻新选择 FLASH CAST 是对的。橱柜质量很好，缓冲五金也很顺，台面安装精细，以后卧室也会继续找他们。",
      client: "Wong 先生与太太",
      location: "Bangsar, KL",
      type: "厨房装修",
    },
    {
      text: "我们的旧排屋需要重拉电线、水管和整体翻新。FLASH CAST 每个阶段都解释得很清楚，现场问题也处理得专业，没有一直推不必要的升级。",
      client: "Lim 先生",
      location: "Cheras, KL",
      type: "老房翻新",
    },
    {
      text: "店铺装修从动线规划到最后修补都由他们协调。团队理解我们开业时间很紧，工种安排得好，最后可以按计划开门营业。",
      client: "Aisha 女士",
      location: "Subang Jaya",
      type: "店铺装修",
    },
    {
      text: "定制衣柜和收纳做好后，整个单位实用很多。尺寸量得准，收口整齐，交屋前现场也整理得很干净。",
      client: "Chan 先生",
      location: "Puchong",
      type: "定制内嵌家具",
    },
  ],
} as const;

const testimonialTypeLabels = {
  en: {
    "Condo Renovation": "Condo Renovation",
    "Office Fit-Out": "Office Fit-Out",
    "Kitchen Renovation": "Kitchen Renovation",
    "Old House Renovation": "Old House Renovation",
    "Shoplot Renovation": "Shoplot Renovation",
    "Custom Built-In Furniture": "Custom Built-In Furniture",
    公寓装修: "Condo Renovation",
    办公室装修: "Office Fit-Out",
    厨房装修: "Kitchen Renovation",
    老房翻新: "Old House Renovation",
    店铺装修: "Shoplot Renovation",
    定制内嵌家具: "Custom Built-In Furniture",
  },
  zh: {
    "Condo Renovation": "公寓装修",
    "Office Fit-Out": "办公室装修",
    "Kitchen Renovation": "厨房装修",
    "Old House Renovation": "老房翻新",
    "Shoplot Renovation": "店铺装修",
    "Custom Built-In Furniture": "定制内嵌家具",
    公寓装修: "公寓装修",
    办公室装修: "办公室装修",
    厨房装修: "厨房装修",
    老房翻新: "老房翻新",
    店铺装修: "店铺装修",
    定制内嵌家具: "定制内嵌家具",
  },
} as const;

const formatTestimonialType = (value: string, language: "en" | "zh") => {
  const mapped = testimonialTypeLabels[language][value as keyof (typeof testimonialTypeLabels)[typeof language]];
  return mapped || translateDisplayText(value, language);
};

const TestimonialsSection = () => {
  const { language } = useLanguage();
  const t = useT();
  const { data: publishedTestimonials } = usePublishedTestimonials(language);
  const items = useMemo(() => {
    const fallbackItems = fallbackTestimonials[language];
    if (!publishedTestimonials?.length) return fallbackItems;
    const cmsItems = publishedTestimonials.map((item, index) => ({
      text: item.text,
      client: item.client,
      location: fallbackItems[index]?.location || "",
      type: fallbackItems[index]?.type || "",
    }));
    return [...cmsItems, ...fallbackItems.slice(cmsItems.length)].slice(0, 6);
  }, [language, publishedTestimonials]);

  const heading = useMemo(
    () => ({
      title: t("testimonials.title"),
      subtitle: t("testimonials.subtitle"),
    }),
    [t],
  );

  return (
    <section className="section-padding bg-muted" id="testimonials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{heading.title}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">{heading.subtitle}</p>
          </div>
        </Reveal>

        <div className="card-grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={`${item.client}-${i}`} delay={i * 100}>
              <div className="card-equal bg-card border border-border rounded-lg p-6 hover-lift">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-gold" />
                  ))}
                </div>
                <blockquote className="card-equal-body text-sm leading-relaxed mb-5">"{item.text}"</blockquote>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm">{item.client}</p>
                  <p className="text-muted-foreground text-xs">
                    {[formatTestimonialType(item.type, language), translateDisplayText(item.location, language)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
