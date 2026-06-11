import { MapPin, CheckCircle } from "lucide-react";
import { Layers, MessageCircle, Paintbrush, ShieldCheck, Target, Users, Wrench, type LucideIcon } from "lucide-react";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import IconCardGrid from "@/components/blocks/IconCardGrid";
import { coreValues, teamHighlights } from "@/data/siteContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { aboutCopy, aboutMilestoneCopy, aboutStatCopy, aboutTeamCopy, aboutValueCopy } from "@/i18n/aboutContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { usePublishedAboutSection, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useMemo } from "react";

const localizedValues = {
  en: coreValues.map((item, index) => ({
    ...item,
    title: aboutValueCopy.en[index]?.title || item.title,
    desc: aboutValueCopy.en[index]?.desc || item.desc,
  })),
  zh: coreValues.map((item, index) => ({
    ...item,
    title: aboutValueCopy.zh[index]?.title || item.title,
    desc: aboutValueCopy.zh[index]?.desc || item.desc,
  })),
};

const localizedTeam = {
  en: teamHighlights.map((item, index) => ({
    ...item,
    title: aboutTeamCopy.en[index]?.title || item.title,
    desc: aboutTeamCopy.en[index]?.desc || item.desc,
  })),
  zh: teamHighlights.map((item, index) => ({
    ...item,
    title: aboutTeamCopy.zh[index]?.title || item.title,
    desc: aboutTeamCopy.zh[index]?.desc || item.desc,
  })),
};

const localizedMilestones = aboutMilestoneCopy;
const localizedStats = aboutStatCopy;

const aboutIconMap = {
  check: CheckCircle,
  checkcircle: CheckCircle,
  layers: Layers,
  messagecircle: MessageCircle,
  paintbrush: Paintbrush,
  shieldcheck: ShieldCheck,
  target: Target,
  users: Users,
  wrench: Wrench,
};

type IconCardItem = { icon: LucideIcon; title: string; desc: string };
type AboutStatItem = { value: string; label: string };
type AboutMilestoneItem = { year: string; title: string; desc: string };

const normalizeIconCardItems = (items: unknown, fallback: IconCardItem[]) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalized = items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const iconKey = String(record.icon || "").toLowerCase().replace(/[\s_-]+/g, "");
      return {
        icon: aboutIconMap[iconKey as keyof typeof aboutIconMap] || fallback[index]?.icon || CheckCircle,
        title: String(record.title || record.title_zh || record.title_en || "").trim(),
        desc: String(record.desc || record.desc_zh || record.desc_en || "").trim(),
      };
    })
    .filter((item) => item.title && item.desc);
  return normalized.length ? normalized : null;
};

const About = () => {
  const { language } = useLanguage();
  const t = aboutCopy[language];
  const settings = useSiteSettings();

  const { data: heroSection } = usePublishedAboutSection(language, "hero");
  const { data: introSection } = usePublishedAboutSection(language, "intro");
  const { data: statsSection } = usePublishedAboutSection(language, "stats");
  const { data: valuesSection } = usePublishedAboutSection(language, "core_values");
  const { data: teamSection } = usePublishedAboutSection(language, "team");
  const { data: milestonesSection } = usePublishedAboutSection(language, "milestones");
  const { data: officeSection } = usePublishedAboutSection(language, "office");
  const { data: pageContent } = usePublishedSitePage(language, "about");

  const dynamicIntroParagraphs = useMemo<string[] | null>(() => {
    const items = introSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const asStrings = items.filter((x): x is string => typeof x === "string");
    return asStrings.length ? asStrings : null;
  }, [introSection?.items]);

  const dynamicStats = useMemo<Array<{ value: string; label: string }> | null>(() => {
    const items = statsSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const normalized = items
      .map((x): AboutStatItem => {
        const record = x as Record<string, unknown>;
        return {
          value: String(record.value ?? ""),
          label: String(record.label ?? ""),
        };
      })
      .filter((x) => x.value && x.label);
    return normalized.length ? normalized : null;
  }, [statsSection?.items]);

  const dynamicMilestones = useMemo<Array<{ year: string; title: string; desc: string }> | null>(() => {
    const items = milestonesSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const normalized = items
      .map((x): AboutMilestoneItem => {
        const record = x as Record<string, unknown>;
        return {
          year: String(record.year ?? ""),
          title: String(record.title ?? ""),
          desc: String(record.desc ?? ""),
        };
      })
      .filter((x) => x.year && x.title && x.desc);
    return normalized.length ? normalized : null;
  }, [milestonesSection?.items]);

  const dynamicValues = useMemo(() => normalizeIconCardItems(valuesSection?.items, localizedValues[language]), [valuesSection?.items, language]);
  const dynamicTeam = useMemo(() => normalizeIconCardItems(teamSection?.items, localizedTeam[language]), [teamSection?.items, language]);
  const displayedMilestones = dynamicMilestones || localizedMilestones[language];
  const heroImage = resolvePageHeroImage(heroSection?.image_url as string | undefined, pageHeroImages.about);
  const fallbackIntro = useMemo(() => {
    const intro: string[] = [...t.intro];
    if (settings.address) {
      intro[1] = t.intro[1].replace("94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur", settings.address);
    }
    return intro;
  }, [settings.address, t.intro]);
  const officeDescription = settings.address ? t.officeAddress.replace("{address}", settings.address) : t.officeDescription;

  return (
    <main className="pt-site-header overflow-x-hidden">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/about"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbAbout, url: "/about" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={t.imageAlt}
        label={t.label}
        title={(heroSection?.title as string) || t.title}
        description={(heroSection?.content as string) || (heroSection?.subtitle as string) || t.description}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <div className="subpage-local-heading--balanced">
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold">{(introSection?.title as string) || t.introTitle}</h2>
                </div>
                {(dynamicIntroParagraphs || fallbackIntro).map((paragraph) => (
                  <p key={paragraph} className="text-muted-foreground mb-4">{paragraph}</p>
                ))}
                <div className="flex flex-wrap gap-3">
                  {t.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div className="card-grid grid-cols-2 gap-5">
                {(dynamicStats || localizedStats[language]).map((stat) => (
                  <div key={stat.label} className="text-center luxury-card p-6 group hover-lift">
                    <span className="text-limit-1 font-display text-2xl md:text-3xl font-bold text-accent mb-1">{stat.value}</span>
                    <span className="text-limit-2 text-muted-foreground text-xs leading-relaxed">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={(valuesSection?.title as string) || t.valuesTitle} description={(valuesSection?.content as string) || t.valuesDescription} />
          <IconCardGrid items={dynamicValues || localizedValues[language]} columns={2} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={(teamSection?.title as string) || t.teamTitle} description={(teamSection?.content as string) || t.teamDescription} />
          <IconCardGrid items={dynamicTeam || localizedTeam[language]} columns={4} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={(milestonesSection?.title as string) || t.journeyTitle} description={(milestonesSection?.content as string) || t.journeyDescription} />
          <div className="max-w-2xl mx-auto">
            {displayedMilestones.map((milestone, i: number) => (
              <Reveal key={milestone.year} delay={i * 60}>
                <div className="flex gap-5 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/15 text-xs font-bold text-gold">
                      {milestone.year.slice(2)}
                    </div>
                    {i < displayedMilestones.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-accent font-bold text-sm">{milestone.year}</span>
                      <h3 className="font-display font-semibold text-sm md:text-base">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <Reveal>
          <div className="container-narrow">
            <SectionHeader title={(officeSection?.title as string) || t.officeTitle} description={(officeSection?.content as string) || officeDescription} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
              <div className="luxury-card flex flex-col items-center justify-center p-8 text-center hover-lift">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="font-semibold mb-1">{settings.company_name}</p>
                <p className="text-muted-foreground text-sm mb-3 whitespace-pre-line">{settings.address}</p>
                <p className="text-muted-foreground text-xs">{t.hours}</p>
              </div>
              <GoogleMapEmbed
                title={t.mapTitle}
                addressLabel={settings.address}
                latitude={settings.map_latitude}
                longitude={settings.map_longitude}
                height={220}
                className="min-h-[220px]"
              />
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default About;
