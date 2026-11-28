import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Language } from "@/i18n/languageDetection";
import { designServiceOverviewText } from "@/i18n/designServiceOverviewText";
import { sanitizeServiceOverviewHtml } from "@/lib/serviceOverviewHtml";

type ContentsLink = { id: string; label: string };

function prepareOverview(content: string, language: Language) {
  const html = sanitizeServiceOverviewHtml(content, language, { preserveLists: true });
  const links: ContentsLink[] = [];
  if (!html || typeof document === "undefined") return { markup: { __html: html }, links };

  const body = document.createElement("div");
  body.innerHTML = html;
  const copy = designServiceOverviewText[language];
  const headings = Array.from(body.querySelectorAll("h2, h3"));
  const mainLevel = headings.some(node => node.tagName === "H2" && node.textContent.trim()) ? "H2" : "H3";
  const lead = body.firstElementChild;
  const planning = headings.find(node => node.textContent.trim() === copy.topics.planning[0]);
  const preparation = headings.find(node => node.textContent.trim() === copy.topics.preparation[0]);

  // Only split the recognized plain-text CMS introduction. Preserve rich or custom introductions verbatim.
  if (planning && preparation && lead?.tagName === "P" && !lead.children.length && lead.nextElementSibling === planning) {
    const text = lead.textContent;
    const split = text.indexOf(copy.consultationStart);
    if (text.startsWith(copy.introductionStart) && split > 0) {
      const consultation = document.createElement("p");
      consultation.textContent = text.slice(split);
      lead.textContent = text.slice(0, split).trimEnd();
      planning.after(lead);
      preparation.after(consultation);
    }
  }

  const topics = Object.values(copy.topics);
  for (const node of headings) {
    const label = node.textContent.trim();
    const main = node.tagName === mainLevel;
    const heading = document.createElement(main ? "h3" : "h4");
    if (main && label) {
      heading.id = `fcd-overview-section-${links.length + 1}`;
      heading.tabIndex = -1;
      const topic = topics.find(([title]) => title === label);
      links.push({ id: heading.id, label: topic?.[1] ?? label });
    }
    heading.append(...Array.from(node.childNodes));
    node.replaceWith(heading);
  }
  return { markup: { __html: body.innerHTML }, links };
}

export default function DesignServiceOverview({ content, language, title }: { content: string; language: Language; title: string }) {
  const { markup, links } = useMemo(() => prepareOverview(content, language), [content, language]);
  const body = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const hasContents = links.length > 1;

  useEffect(() => {
    if (!hasContents || !body.current) return;
    const headings = Array.from(body.current.querySelectorAll<HTMLElement>("h3[id]"));
    let frame = 0;
    function update() {
      frame = 0;
      const offset = parseFloat(getComputedStyle(headings[0]).scrollMarginTop) || 0;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > offset + 2) break;
        current = heading;
      }
      setActive(current.id);
    }
    function queueUpdate() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    queueUpdate();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [links, hasContents]);

  if (!markup.__html) return null;
  const contents = designServiceOverviewText[language].contents;
  return (
    <section className="fcd-overview fcd-page-gutter fcd-section-space" data-cinematic-section aria-labelledby="fcd-overview-title">
      <div className="fcd-overview__rail" onKeyDown={event => {
        if (event.key === "Escape" && open && toggle.current?.getClientRects().length) {
          setOpen(false);
          toggle.current.focus();
        }
      }}>
        <h2 id="fcd-overview-title">{title}</h2>
        {hasContents && <>
          <button ref={toggle} type="button" className="fcd-overview__toggle" aria-expanded={open} aria-controls="fcd-overview-nav" onClick={() => setOpen(value => !value)}>
            {contents}<ChevronDown aria-hidden="true" size={16} />
          </button>
          <nav id="fcd-overview-nav" className="fcd-overview__nav" aria-label={contents}>
            {links.map(({ id, label }) => (
              <a key={id} href={`#${id}`} aria-current={(active || links[0].id) === id ? "location" : undefined}
                onClick={event => {
                  if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) setOpen(false);
                }}>
                {label}
              </a>
            ))}
          </nav>
        </>}
      </div>
      <article ref={body} className="fcd-overview__body" aria-labelledby="fcd-overview-title" dangerouslySetInnerHTML={markup} />
    </section>
  );
}
