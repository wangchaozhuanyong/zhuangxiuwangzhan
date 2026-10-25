import type { ReactNode } from "react";

export function SchemeASection({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string | readonly ReactNode[];
  children: ReactNode;
  className?: string;
}) {
  const paragraphs = typeof description === "string" ? (description ? [description] : []) : description || [];
  return (
    <section className={`fc-route-section ${className}`.trim()}>
      <div className="scheme-a-frame fc-route-section-frame">
        {title || paragraphs.length ? (
          <header className="fc-route-section-head scheme-a-heading">
            {title ? <h2>{/[，；：]/u.test(title)
              ? title.match(/[^，；：]*[，；：]|[^，；：]+$/gu)?.map((phrase, index) => (
                <span className="scheme-a-heading-phrase" key={`${index}-${phrase}`}>{phrase}</span>
              ))
              : title}</h2> : null}
            {paragraphs.map((paragraph, index) => <p key={`${index}-${typeof paragraph === "string" ? paragraph : "linked"}`}>{paragraph}</p>)}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
