import type { ReactNode } from "react";

type SectionCopy = {
  title?: string;
  description?: string | readonly ReactNode[];
};

export function SchemeASectionHeading({
  title,
  description,
  reading = false,
}: SectionCopy & { reading?: boolean }) {
  const paragraphs = typeof description === "string" ? (description ? [description] : []) : description || [];
  if (!title && !paragraphs.length) return null;

  const paired = title && paragraphs.length === 1 && !reading;
  return (
    <header className={`fc-route-section-head scheme-a-heading ${paired ? "scheme-a-heading--row" : "scheme-a-heading--reading"}`}>
      {title ? <h2>{/[，；：]/u.test(title)
        ? title.match(/[^，；：]*[，；：]|[^，；：]+$/gu)?.map((phrase, index) => (
          <span className="scheme-a-heading-phrase" key={`${index}-${phrase}`}>{phrase}</span>
        ))
        : title}</h2> : null}
      {paragraphs.map((paragraph, index) => <p key={`${index}-${typeof paragraph === "string" ? paragraph : "linked"}`}>{paragraph}</p>)}
    </header>
  );
}

export function SchemeASection({
  title,
  description,
  children,
  className = "",
}: SectionCopy & { children: ReactNode; className?: string }) {
  return (
    <section className={`fc-route-section ${className}`.trim()}>
      <div className="scheme-a-frame fc-route-section-frame">
        <SchemeASectionHeading title={title} description={description} reading={children == null || children === false} />
        {children}
      </div>
    </section>
  );
}
