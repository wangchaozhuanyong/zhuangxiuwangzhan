import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { getPublishedTestimonials } from "@/lib/contentApi";

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
  ],
  zh: [
    {
      text: "团队响应很快，施工品质也很稳定。项目按时交付，最终效果整洁又有质感，报价清楚，没有隐藏收费。",
      client: "Tan 先生",
      location: "Mont Kiara, KL",
      type: "公寓装修",
    },
    {
      text: "装修过程中沟通顺畅，工地主管随时都在，周报照片也让我们很放心。最终成品和 3D 设计几乎一模一样。",
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
  ],
};

const TestimonialsSection = () => {
  const { language } = useLanguage();
  const t = useT();
  const [items, setItems] = useState(fallbackTestimonials[language]);

  useEffect(() => {
    let active = true;

    void getPublishedTestimonials(language).then((data) => {
      if (!active) return;
      setItems(
        data.length
          ? data.map((item, index) => ({
              text: item.text,
              client: item.client,
              location: fallbackTestimonials[language][index]?.location || "",
              type: fallbackTestimonials[language][index]?.type || "",
            }))
          : fallbackTestimonials[language]
      );
    });

    return () => {
      active = false;
    };
  }, [language]);

  const heading = useMemo(() => ({
    en: {
      title: t("testimonials.title"),
      subtitle: t("testimonials.subtitle"),
    },
    zh: {
      title: t("testimonials.title"),
      subtitle: t("testimonials.subtitle"),
    },
  })[language], [language, t]);

  return (
    <section className="section-padding bg-muted" id="testimonials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{heading.title}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              {heading.subtitle}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Reveal key={`${item.client}-${i}`} delay={i * 100}>
              <div className="bg-card border border-border rounded-lg p-6 hover-lift h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-gold" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5 flex-1">
                  "{item.text}"
                </blockquote>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm">{item.client}</p>
                  <p className="text-muted-foreground text-xs">
                    {[item.type, item.location].filter(Boolean).join(" · ")}
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
