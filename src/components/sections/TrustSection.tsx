import { Star, Shield, Users, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { testimonials } from "@/data/siteContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";

const stats = {
  en: [
    { icon: Star, value: "200+", label: "Completed Projects", iconClass: "text-gold" },
    { icon: Star, value: "10+", label: "Years Experience", iconClass: "text-gold" },
    { icon: Star, value: "Trusted", label: "By Homeowners & Businesses", iconClass: "text-gold" },
    { icon: Shield, value: "SSM", label: "Registered Company", iconClass: "text-gold" },
  ],
  zh: [
    { icon: Star, value: "200+", label: "已完成项目", iconClass: "text-gold" },
    { icon: Star, value: "10+", label: "行业经验", iconClass: "text-gold" },
    { icon: Star, value: "信赖", label: "业主与企业客户", iconClass: "text-gold" },
    { icon: Shield, value: "SSM", label: "注册公司", iconClass: "text-gold" },
  ],
};

const copy = {
  en: {
    title: "What Our Clients Say",
    subtitle: "Feedback from homeowners and businesses across KL and Selangor.",
    badges: ["SSM Registered Company", "In-House Design & Build Team", "94, Jalan Mega Mendung, 58200 KL"],
  },
  zh: {
    title: "客户怎么说",
    subtitle: "来自吉隆坡和雪兰莪的业主与企业客户真实反馈。",
    badges: ["SSM 注册公司", "自有设计与施工团队", "94, Jalan Mega Mendung, 58200 吉隆坡"],
  },
};

const TrustSection = () => {
  const { language } = useLanguage();
  const content = copy[language];

  return (
    <section className="section-padding bg-background" id="trust">
      <div className="container-narrow">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {stats[language].map((item, i) => (
            <Reveal key={item.label} delay={i * 100}>
              <div className="text-center p-5 md:p-6 rounded-lg border border-border bg-card group h-full">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${item.iconClass} transition-transform duration-300 group-hover:scale-110`} />
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{item.value}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{item.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-12">
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{content.title}</h2>
              <p className="text-muted-foreground text-sm">{content.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {testimonials.map((testimonial, i) => (
                <Reveal key={i} delay={250 + i * 100}>
                  <div className="p-5 md:p-6 bg-card rounded-lg border border-border h-full flex flex-col">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-gold fill-gold" />
                      ))}
                    </div>
                    <p className="italic text-foreground text-sm leading-relaxed mb-4 flex-1">
                      "{translateDisplayText(testimonial.text, language)}"
                    </p>
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium">{testimonial.client}</p>
                      <p className="text-xs text-muted-foreground">
                        {translateDisplayText(testimonial.type, language)} · {translateDisplayText(testimonial.location, language)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="w-4 h-4 text-accent" />
              <span className="font-medium">{content.badges[0]}</span>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4 text-accent" />
              <span className="font-medium">{content.badges[1]}</span>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="font-medium">{content.badges[2]}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default TrustSection;
