import { Shield, Users, MapPin, ClipboardList } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";

const stats = {
  en: [
    { icon: ClipboardList, value: "Scope", label: "Clear Project Planning", iconClass: "text-gold" },
    { icon: MapPin, value: "KL & Selangor", label: "Local Service Areas", iconClass: "text-gold" },
    { icon: Users, value: "Homes & Businesses", label: "Residential and Commercial", iconClass: "text-gold" },
    { icon: Shield, value: "SSM", label: "Registered Company", iconClass: "text-gold" },
  ],
  zh: [
    { icon: ClipboardList, value: "Scope", label: "清楚规划范围", iconClass: "text-gold" },
    { icon: MapPin, value: "KL & Selangor", label: "本地服务区域", iconClass: "text-gold" },
    { icon: Users, value: "住宅与商业", label: "住宅和商业项目", iconClass: "text-gold" },
    { icon: Shield, value: "SSM", label: "注册公司", iconClass: "text-gold" },
  ],
};

const copy = {
  en: {
    title: "Why Clients Contact FLASH CAST",
    subtitle: "Clear scope discussion, local service coverage, and visible company contact details.",
    badges: ["SSM Registered Company", "Design & Build Coordination", "94, Jalan Mega Mendung, 58200 KL"],
  },
  zh: {
    title: "客户为什么联系 FLASH CAST",
    subtitle: "先把装修范围、服务地区和公司联系方式讲清楚。",
    badges: ["SSM 注册公司", "设计与施工协调", "94, Jalan Mega Mendung, 58200 KL"],
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
              <div className="text-center p-5 md:p-6 rounded-card border border-border bg-card group h-full">
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
          <div className="mt-12 text-center">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{content.title}</h2>
            <p className="text-muted-foreground text-sm">{content.subtitle}</p>
          </div>
        </Reveal>

        <Reveal delay={300}>
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
