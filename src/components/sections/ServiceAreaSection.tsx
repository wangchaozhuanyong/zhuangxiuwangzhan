import Link from "@/components/LocalizedLink";
import { MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";

const serviceAreas = [
  {
    name: { en: "Kuala Lumpur", zh: "吉隆坡" },
    slug: "kuala-lumpur",
    areas: { en: "Mont Kiara, Bangsar, Cheras, Kepong, Sentul, Sri Hartamas, City Centre", zh: "?????????????Sentul?Sri Hartamas????" },
  },
  {
    name: { en: "Petaling Jaya", zh: "八打灵再也" },
    slug: "petaling-jaya",
    areas: { en: "SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA", zh: "SS2?Damansara?Kelana Jaya?PJ ???Section 17?Taman SEA" },
  },
  {
    name: { en: "Subang Jaya", zh: "梳邦再也" },
    slug: "subang-jaya",
    areas: { en: "USJ, SS15, SS16, Sunway, Putra Heights", zh: "USJ?SS15?SS16?Sunway?Putra Heights" },
  },
  {
    name: { en: "Shah Alam", zh: "莎阿南" },
    slug: "selangor",
    areas: { en: "All sections, Setia Alam, Kota Kemuning, Bukit Jelutong", zh: "????Setia Alam?Kota Kemuning?Bukit Jelutong" },
  },
  {
    name: { en: "Puchong", zh: "蒲种" },
    slug: "selangor",
    areas: { en: "Bandar Puteri, IOI Boulevard, Taman Puchong", zh: "Bandar Puteri?IOI Boulevard?????" },
  },
  {
    name: { en: "Cheras", zh: "蕉赖" },
    slug: "cheras",
    areas: { en: "Taman Connaught, Taman Midah, Taman Segar, Batu 9", zh: "Taman Connaught?Taman Midah?Taman Segar?Batu 9" },
  },
];

const copy = {
  en: {
    title: "Service Areas",
    intro:
      "FLASH CAST SDN. BHD. is based in Kuala Lumpur and provides renovation services across the entire KL and Selangor region. Free site measurement for all enquiries within our coverage area.",
    footerText: "Don't see your area? We may still be able to help.",
    footerLinkText: "Contact us",
    footerSuffix: "to check availability.",
  },
  zh: {
    title: "服务区域",
    intro:
      "FLASH CAST SDN. BHD. 总部位于吉隆坡，服务范围覆盖整个吉隆坡与雪兰莪地区。覆盖区域内的咨询可安排免费上门测量。",
    footerText: "没有看到您的地区？",
    footerLinkText: "联系我们",
    footerSuffix: "确认是否可服务。",
  },
};

const ServiceAreaSection = () => {
  const { language } = useLanguage();
  const content = copy[language];

  return (
    <section className="section-padding bg-muted" id="service-area">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{content.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {content.intro}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {serviceAreas.map((area, i) => (
            <Reveal key={area.name.en} delay={i * 70}>
              <Link
                to={`/locations/${area.slug}`}
                className="group flex items-start gap-3 p-5 md:p-6 bg-background rounded-lg border border-border hover-lift transition-colors hover:border-accent/30"
              >
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold text-base group-hover:text-accent transition-colors mb-1">
                    {area.name[language]}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {area.areas[language]}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              {content.footerText}{" "}
              <Link to="/contact" className="text-accent hover:underline font-medium">
                {content.footerLinkText}
              </Link>{" "}
              {content.footerSuffix}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ServiceAreaSection;
