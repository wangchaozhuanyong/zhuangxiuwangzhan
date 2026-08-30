import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import Link from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import ImmersiveHero from "@/components/ImmersiveHero";
import { useLanguage } from "@/i18n/LanguageContext";
import { schemeARouteHeroSupportText } from "@/i18n/schemeAText";
import { buildLocalResponsiveSrcSet, isLocalResponsiveImageCandidate } from "@/lib/localResponsiveImage";
import { buildSupabaseSrcSet, isSupabasePublicObjectUrl } from "@/lib/supabaseImage";

const ROUTE_HERO_MOBILE_WIDTHS = [560, 720, 900];
const ROUTE_HERO_TABLET_WIDTHS = [720, 900];
const WIDE_TITLE_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

const appendOriginalCandidate = (srcSet: string | undefined, src: string, sourceWidth?: number) =>
  sourceWidth ? [srcSet, `${src} ${sourceWidth}w`].filter(Boolean).join(", ") : srcSet;

export type SchemeARouteKind = "listing" | "detail" | "content" | "article" | "legal" | "form" | "compare";

export type SchemeARouteImagePosition = {
  desktop?: string;
  tablet?: string;
  mobile?: string;
};

type SchemeARouteHeroMediaStyle = CSSProperties & {
  "--fc-route-hero-position-desktop"?: string;
  "--fc-route-hero-position-tablet"?: string;
  "--fc-route-hero-position-mobile"?: string;
};

export type SchemeAListingItem = {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  image: string;
  imageAlt?: string;
  href: string;
};

export type SchemeAFact = {
  label: string;
  value: string;
};

export type SchemeANumberItem = {
  title: string;
  description?: string;
};

export type SchemeAFaqItem = {
  question: string;
  answer: string;
};

export function SchemeARouteHero({
  kind = "content",
  image,
  imageSourceWidth,
  tabletImage,
  tabletImageSourceWidth,
  mobileImage,
  mobileImageSourceWidth,
  imagePosition,
  imageAlt,
  label,
  title,
  description,
}: {
  kind?: SchemeARouteKind;
  image: string;
  imageSourceWidth?: number;
  tabletImage?: string;
  tabletImageSourceWidth?: number;
  mobileImage?: string;
  mobileImageSourceWidth?: number;
  imagePosition?: SchemeARouteImagePosition;
  imageAlt: string;
  label: string;
  title: string;
  description: string;
}) {
  const { language } = useLanguage();
  const supportCopy = schemeARouteHeroSupportText[language];
  const mediaStyle: SchemeARouteHeroMediaStyle = {
    "--fc-route-hero-position-desktop": imagePosition?.desktop || "center",
    "--fc-route-hero-position-tablet": imagePosition?.tablet || imagePosition?.desktop || "center",
    "--fc-route-hero-position-mobile": imagePosition?.mobile || imagePosition?.tablet || imagePosition?.desktop || "center",
  };
  const titleCharacters = Array.from(title);
  const hasWideTitleCharacter = titleCharacters.some((character) => WIDE_TITLE_CHARACTER.test(character));
  const titleVisualLength = titleCharacters.reduce(
    (length, character) => length + (WIDE_TITLE_CHARACTER.test(character) ? 2 : 1),
    0,
  );
  const usesCompactTitleScale = titleVisualLength > (hasWideTitleCharacter ? 10 : 16);
  const mobileSrcSet = mobileImage
    ? isSupabasePublicObjectUrl(mobileImage)
      ? buildSupabaseSrcSet(mobileImage, ROUTE_HERO_MOBILE_WIDTHS, { height: 1120, quality: 86, resize: "cover" })
      : isLocalResponsiveImageCandidate(mobileImage)
        ? appendOriginalCandidate(
            buildLocalResponsiveSrcSet(mobileImage, ROUTE_HERO_MOBILE_WIDTHS),
            mobileImage,
            mobileImageSourceWidth,
          )
        : undefined
    : undefined;
  const tabletSrcSet = tabletImage
    ? isSupabasePublicObjectUrl(tabletImage)
      ? buildSupabaseSrcSet(tabletImage, ROUTE_HERO_TABLET_WIDTHS, { height: 1400, quality: 84, resize: "cover" })
      : isLocalResponsiveImageCandidate(tabletImage)
        ? appendOriginalCandidate(
            buildLocalResponsiveSrcSet(tabletImage, ROUTE_HERO_TABLET_WIDTHS),
            tabletImage,
            tabletImageSourceWidth,
          )
        : undefined
    : undefined;

  return (
    <ImmersiveHero className={`fc-route-hero fc-route-hero-${kind}`} data-route-hero-layout="editorial-rail">
      <div className="fc-route-hero-media" data-cinematic-media style={mediaStyle}>
        <picture>
          {mobileImage ? (
            <source media="(max-width: 767px)" srcSet={mobileSrcSet || mobileImage} sizes="100vw" />
          ) : null}
          {tabletImage ? (
            <source
              media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
              srcSet={tabletSrcSet || tabletImage}
              sizes="100vw"
            />
          ) : null}
          <SmartImage
            src={image}
            sourceWidth={imageSourceWidth}
            alt={imageAlt}
            width={1600}
            height={1100}
            loading="eager"
            fetchPriority="high"
            revealOnLoad
            sizes="(min-width: 1024px) 64vw, 100vw"
            candidateWidths={[560, 720, 960, 1200, 1600]}
            quality={86}
          />
        </picture>
      </div>
      <div className="fc-route-hero-copy">
        <span className="fc-route-kicker">{label}</span>
        <h1 className={usesCompactTitleScale ? "fc-route-title-long" : undefined}>{title}</h1>
        <p>{description}</p>
        {kind !== "legal" ? (
          <dl className="fc-route-hero-support" aria-label={supportCopy.ariaLabel}>
            {supportCopy.items.map((item, index) => (
              <div key={item.label}>
                <dt><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </ImmersiveHero>
  );
}

export function SchemeASection({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fc-route-section ${className}`.trim()}>
      {title || description ? (
        <header className="fc-route-section-head">
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function SchemeAFilter({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="fc-route-filter" role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function SchemeAListingGrid({ items, actionLabel }: { items: readonly SchemeAListingItem[]; actionLabel: string }) {
  return (
    <div className="fc-route-grid">
      {items.map((item, index) => (
        <Link key={item.id} to={item.href} className="fc-route-card">
          <div className="fc-route-card-media" data-cinematic-media>
            <SmartImage
              src={item.image}
              alt={item.imageAlt || item.title}
              width={index === 0 ? 1200 : 720}
              height={index === 0 ? 750 : 540}
              loading="lazy"
              fetchPriority="auto"
              revealOnLoad
              sizes={index === 0 ? "(max-width: 767px) 100vw, 64vw" : "(max-width: 767px) 50vw, 32vw"}
              candidateWidths={[360, 560, 720, 960, 1200]}
              quality={82}
            />
          </div>
          {item.meta ? <span className="fc-route-card-meta">{item.meta}</span> : null}
          <h3>{item.title}</h3>
          {item.description ? <p>{item.description}</p> : null}
          <span className="fc-route-card-action">{actionLabel}<ArrowUpRight aria-hidden="true" /></span>
        </Link>
      ))}
    </div>
  );
}

export function SchemeALoadMore({ label, onClick, detail }: { label: string; onClick: () => void; detail?: string }) {
  return (
    <button type="button" className="fc-route-more" onClick={onClick}>
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
      <ChevronDown aria-hidden="true" />
    </button>
  );
}

export function SchemeAContentState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="fc-route-state"><p>{children}</p>{action}</div>;
}

export function SchemeAFacts({ items }: { items: readonly SchemeAFact[] }) {
  if (!items.length) return null;
  return (
    <section className="fc-route-facts">
      {items.map((item) => <div key={`${item.label}-${item.value}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}
    </section>
  );
}

export function SchemeANumberList({ items }: { items: readonly SchemeANumberItem[] }) {
  return (
    <ol className="fc-route-number-list">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          <div><strong>{item.title}</strong>{item.description ? <span>{item.description}</span> : null}</div>
        </li>
      ))}
    </ol>
  );
}

function SchemeAFaqRow({ item, defaultOpen }: { item: SchemeAFaqItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const answerId = useId();
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={answerId} onClick={() => setOpen((value) => !value)}>
        <span>{item.question}</span>
        <Plus aria-hidden="true" data-open={open ? "true" : "false"} />
      </button>
      <p id={answerId} hidden={!open}>{item.answer}</p>
    </div>
  );
}

export function SchemeAFaqList({ items }: { items: readonly SchemeAFaqItem[] }) {
  return <div className="fc-route-faq">{items.map((item, index) => <SchemeAFaqRow key={`${item.question}-${index}`} item={item} defaultOpen={index === 0} />)}</div>;
}

export function SchemeAGallery({
  images,
}: {
  images: readonly { src: string; alt: string }[];
}) {
  const visibleImages = images.slice(0, 8);
  const rows: Array<Array<{ src: string; alt: string }>> = [];
  for (let index = 0; index < visibleImages.length; index += 2) {
    rows.push(visibleImages.slice(index, index + 2));
  }

  return (
    <div className="grid gap-2">
      {rows.map((row, rowIndex) => (
        <div
          key={`gallery-row-${rowIndex}`}
          className="fc-route-gallery"
          style={row.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {row.map((image, imageIndex) => {
            const index = rowIndex * 2 + imageIndex;
            return (
              <div key={`${image.src}-${index}`} className="fc-route-gallery-media" data-cinematic-media>
                <SmartImage src={image.src} alt={image.alt} width={1200} height={750} sizes="(max-width: 767px) 100vw, 50vw" candidateWidths={[560, 720, 960, 1200]} quality={84} revealOnLoad />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
