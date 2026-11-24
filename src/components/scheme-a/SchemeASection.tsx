import type { ReactNode } from "react";

type SectionCopy = {
  title?: string;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  description?: string | readonly ReactNode[];
};

export function SchemeASectionHeading({
  title,
  eyebrow,
  badge,
  description,
  reading = false,
}: SectionCopy & { reading?: boolean }) {
  const paragraphs = typeof description === "string" ? (description ? [description] : []) : description || [];
  if (!title && !paragraphs.length && !eyebrow && !badge) return null;

  const hasAnchor = Boolean(eyebrow || badge);
  const paired = title && paragraphs.length === 1 && !reading && !hasAnchor;

  return (
    <header className={`fc-route-section-head scheme-a-heading ${hasAnchor ? "scheme-a-heading--anchored" : (paired ? "scheme-a-heading--row" : "scheme-a-heading--reading")}`}>
      {hasAnchor ? (
        <div className="fc-route-section-head__left">
          {eyebrow ? (
            <span className="scheme-a-eyebrow">
              <span className="scheme-a-eyebrow__dot" aria-hidden="true" />
              {eyebrow}
            </span>
          ) : null}
          {title ? <h2>{/[，；：]/u.test(title)
            ? title.match(/[^，；：]*[，；：]|[^，；：]+$/gu)?.map((phrase, index) => (
              <span className="scheme-a-heading-phrase" key={`${index}-${phrase}`}>{phrase}</span>
            ))
            : title}</h2> : null}
          {badge ? <div className="scheme-a-heading-badge">{badge}</div> : null}
        </div>
      ) : (
        title ? <h2>{/[，；：]/u.test(title)
          ? title.match(/[^，；：]*[，；：]|[^，；：]+$/gu)?.map((phrase, index) => (
            <span className="scheme-a-heading-phrase" key={`${index}-${phrase}`}>{phrase}</span>
          ))
          : title}</h2> : null
      )}
      {hasAnchor ? (
        paragraphs.length ? (
          <div className="fc-route-section-head__right">
            {paragraphs.map((paragraph, index) => (
              <p key={`${index}-${typeof paragraph === "string" ? paragraph : "linked"}`} className={index === 0 && paragraphs.length > 1 ? "fc-route-section-lead" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : null
      ) : (
        paragraphs.map((paragraph, index) => <p key={`${index}-${typeof paragraph === "string" ? paragraph : "linked"}`}>{paragraph}</p>)
      )}
    </header>
  );
}

export function SchemeASection({
  title,
  eyebrow,
  badge,
  description,
  children,
  className = "",
}: SectionCopy & { children?: ReactNode; className?: string }) {
  return (
    <section className={`fc-route-section ${className}`.trim()}>
      <div className="scheme-a-frame fc-route-section-frame">
        <SchemeASectionHeading title={title} eyebrow={eyebrow} badge={badge} description={description} reading={children == null || children === false} />
        {children}
      </div>
    </section>
  );
}
