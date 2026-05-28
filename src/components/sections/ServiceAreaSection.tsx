import Link from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin } from "lucide-react";

const serviceAreas = [
  {
    name: { en: "Kuala Lumpur", zh: "吉隆坡" },
    slug: "kuala-lumpur",
    areas: { en: "Mont Kiara, Bangsar, Cheras, Kepong, Sentul, Sri Hartamas, City Centre", zh: "满家乐、孟沙、蕉赖、甲洞、仙特拉、Sri Hartamas、市中心" },
  },
  {
    name: { en: "Petaling Jaya", zh: "八打灵再也" },
    slug: "petaling-jaya",
    areas: { en: "SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA", zh: "SS2、白沙罗、哥打白沙罗、PJ 新镇、Section 17、Taman SEA" },
  },
  {
    name: { en: "Subang Jaya", zh: "梳邦再也" },
    slug: "subang-jaya",
    areas: { en: "USJ, SS15, SS16, Sunway, Putra Heights", zh: "USJ、SS15、SS16、Sunway、Putra Heights" },
  },
  {
    name: { en: "Shah Alam", zh: "莎阿南" },
    slug: "selangor",
    areas: { en: "All sections, Setia Alam, Kota Kemuning, Bukit Jelutong", zh: "各区、Setia Alam、Kota Kemuning、Bukit Jelutong" },
  },
  {
    name: { en: "Puchong", zh: "蒲种" },
    slug: "puchong",
    areas: { en: "Bandar Puteri, IOI Boulevard, Taman Puchong", zh: "Bandar Puteri、IOI Boulevard、Taman Puchong" },
  },
  {
    name: { en: "Cheras", zh: "蕉赖" },
    slug: "cheras",
    areas: { en: "Taman Connaught, Taman Midah, Taman Segar, Batu 9", zh: "Taman Connaught、Taman Midah、Taman Segar、Batu 9" },
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
    title: "服务地区",
    intro:
      "FLASH CAST SDN. BHD. 总部位于吉隆坡，服务范围覆盖整个吉隆坡与雪兰莪地区。覆盖范围内的咨询可安排免费上门测量。",
    footerText: "没有看到您的地区？",
    footerLinkText: "联系我们",
    footerSuffix: "确认是否可提供服务。",
  },
};

const ServiceAreaSection = () => {
  const { language } = useLanguage();
  const content = copy[language];

  return (
    <section className="section-padding bg-muted" id="service-area">
      <div className="container-narrow">
        <Reveal>
          <div className="mb-10 text-center md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display mb-3 text-3xl font-bold md:text-4xl">{content.title}</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">{content.intro}</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((area, i) => (
            <Reveal key={area.name.en} delay={i * 70}>
              <Link
                to={`/locations/${area.slug}`}
                className="group flex items-start gap-3 rounded-lg border border-border bg-background p-5 transition-colors hover:border-accent/30 hover-lift md:p-6"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <h3 className="mb-1 font-display text-base font-semibold transition-colors group-hover:text-accent">
                    {area.name[language]}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{area.areas[language]}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {content.footerText}{" "}
              <Link to="/contact" className="font-medium text-accent hover:underline">
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
