import { ArrowRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import { blogServiceLinks } from "@/data/blogServiceLinks";
import { useLanguage } from "@/i18n/LanguageContext";
import { relatedServiceLinksText } from "@/i18n/relatedServiceLinksText";

export default function RelatedServiceLinks({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const links = blogServiceLinks[slug];

  if (!Array.isArray(links) || links.length === 0) return null;

  const title = relatedServiceLinksText[language];

  return (
    <nav aria-label={title} className="my-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="fc-route-link-grid">
        {links.slice(0, 2).map(({ target, anchor }) => (
          <Link key={target} to={target} className="fc-route-link-card">
            <span className="min-w-0 break-words">{anchor[language]}</span>
            <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
