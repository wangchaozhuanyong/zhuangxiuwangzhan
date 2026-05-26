import Link from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";

const copy = {
  en: {
    intro:
      "FLASH CAST SDN. BHD. is a professional renovation company based in Kuala Lumpur, Malaysia. We specialize in interior renovation, custom built-in furniture, commercial fit-out, artistic wall coating (German Remmers), and full project management solutions across Selangor and the Klang Valley.",
    areasPrefix: "Serving",
  },
  zh: {
    intro:
      "FLASH CAST SDN. BHD. 是一家总部位于马来西亚吉隆坡的专业装修公司。我们专注于室内装修、定制家具、商业空间装修、德国 Remmers 艺术涂料，以及覆盖雪兰莪和巴生谷的全案管理服务。",
    areasPrefix: "服务区域",
  },
};

const GeoSection = () => {
  const { language } = useLanguage();
  const content = copy[language];

  return (
    <section className="section-padding bg-muted border-t border-border">
      <div className="container-narrow">
        <Reveal>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-center max-w-3xl mx-auto mb-4">
            {content.intro}
          </p>
          <p className="text-muted-foreground text-xs md:text-sm text-center max-w-2xl mx-auto">
            {content.areasPrefix}{" "}
            <Link to="/locations/kuala-lumpur" className="hover:underline text-foreground font-medium">Kuala Lumpur</Link>{" · "}
            <Link to="/locations/petaling-jaya" className="hover:underline text-foreground font-medium">Petaling Jaya</Link>{" · "}
            <Link to="/locations/cheras" className="hover:underline text-foreground font-medium">Cheras</Link>{" · "}
            <Link to="/locations/mont-kiara" className="hover:underline text-foreground font-medium">Mont Kiara</Link>{" · "}
            <Link to="/locations/bangsar" className="hover:underline text-foreground font-medium">Bangsar</Link>{" · "}
            <Link to="/locations/subang-jaya" className="hover:underline text-foreground font-medium">Subang Jaya</Link>{" · "}
            Shah Alam · Puchong · Damansara
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default GeoSection;
