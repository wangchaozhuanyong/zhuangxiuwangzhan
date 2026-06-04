import FooterPreludeCta from "@/components/blocks/FooterPreludeCta";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSectionText } from "@/i18n/homeSectionsText";
import { useT } from "@/i18n/useT";
import { usePublishedCtaBlock } from "@/hooks/usePublishedContent";
import type { PublishedCtaBlock } from "@/lib/homeContentApi";

type CTASectionProps = {
  ctaBlock?: PublishedCtaBlock | null;
};

const CTASection = ({ ctaBlock: providedCtaBlock }: CTASectionProps) => {
  const { language } = useLanguage();
  const t = useT();
  const content = homeSectionText.cta[language];
  const { data: fetchedCtaBlock } = usePublishedCtaBlock(language, "home_final", { enabled: providedCtaBlock === undefined });
  const ctaBlock = providedCtaBlock === undefined ? fetchedCtaBlock : providedCtaBlock;
  const dynamic = ctaBlock
    ? {
        title: ctaBlock.title,
        description: ctaBlock.description,
        primary_label: ctaBlock.primary_label,
        primary_url: ctaBlock.primary_url,
      }
    : {};

  const title = dynamic?.title || content.title;
  const description = dynamic?.description || content.description;
  const primaryLabel = dynamic?.primary_label || t("cta.getQuote");
  const primaryUrl = dynamic?.primary_url || "/quote";

  return (
    <FooterPreludeCta
      id="cta"
      eyebrow={content.eyebrow}
      title={title}
      description={description}
      quoteLabel={primaryLabel}
      quotePath={primaryUrl}
      whatsappLabel={t("cta.whatsapp")}
      whatsappSource="Home CTA"
    />
  );
};

export default CTASection;
