import { useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUpRight, Camera, Focus, Ruler } from "lucide-react";
import Link from "@/components/LocalizedLink";
import ImmersiveHero from "@/components/ImmersiveHero";
import SmartImage from "@/components/SmartImage";
import { buildLocalResponsiveSrcSet } from "@/lib/localResponsiveImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePageConsultation } from "@/contexts/PublicChromeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { surfaceRepairPageText } from "@/i18n/surfaceRepairPageText";
import { serviceDetailPageText } from "@/i18n/serviceDetailPageText";
import { trackCtaClick } from "@/lib/analytics";
import type { PublishedServiceSummary } from "@/lib/contentApi";
import { stripHtml } from "@/lib/text";
import "@/styles/design-service.css";
import "@/styles/surface-repair.css";

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return <header className="fcd-section-heading fc-route-section-head scheme-a-heading scheme-a-heading--split"><h2>{title}</h2>{description && <p>{description}</p>}</header>;
}

type Status = "generatedLabel" | "staleLabel" | "editedLabel" | "keptLabel" | "copiedLabel" | "copyError";
const imageRoot = "/images/services/surface-repair/";
const photoIcons = [Camera, Focus, Ruler];

export default function SurfaceRepairContent({ service }: { service: PublishedServiceSummary }) {
  const { language } = useLanguage();
  const copy = surfaceRepairPageText[language];
  const common = serviceDetailPageText[language];
  const settings = useSiteSettings();
  usePageConsultation();
  const tool = useRef<HTMLDetailsElement>(null);
  const categoryInput = useRef<HTMLSelectElement>(null);
  const regionInput = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLTextAreaElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const suggestedDamage = useRef("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [risk, setRisk] = useState(false);
  const [regionError, setRegionError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [generated, setGenerated] = useState("");
  const [replaceWarning, setReplaceWarning] = useState(false);
  const [status, setStatus] = useState<Status>("generatedLabel");
  const title = stripHtml(service.title);
  const summary = stripHtml(service.summary);
  const seoTitle = stripHtml(service.seoTitle || service.title);
  const seoDescription = stripHtml(service.seoDescription || service.summary);
  const faqs = service.faqs.map(item => ({ question: stripHtml(item.q || ""), answer: stripHtml(item.a || "") })).filter(item => item.question && item.answer);
  const steps = service.processSteps.length ? service.processSteps : copy.process.map(item => ({ title: item.title, desc: item.description }));
  const titleLines = title === copy.siteHero.titleLines.join(language === "zh" ? "" : " ") ? copy.siteHero.titleLines : [title];
  const markChanged = () => { setReplaceWarning(false); if (message !== null) setStatus("staleLabel"); };
  const focusOutput = () => requestAnimationFrame(() => output.current?.focus());
  const chooseCategory = (id: string, damage = "") => {
    setCategory(id);
    if (!description.trim() || description === suggestedDamage.current) { setDescription(damage); suggestedDamage.current = damage; }
    markChanged();
    if (tool.current) tool.current.open = true;
    requestAnimationFrame(() => {
      categoryInput.current?.focus({ preventScroll: true });
      categoryInput.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };
  const generate = (replace = false) => {
    if (!region.trim()) { setRegionError(true); setReplaceWarning(false); regionInput.current?.focus(); return; }
    if (!replace && message !== null && message !== generated) {
      setReplaceWarning(true); requestAnimationFrame(() => keepButton.current?.focus()); return;
    }
    const categoryTitle = copy.services.find(item => item.id === category)?.title || copy.unknownCategory;
    const lines = [copy.messageGreeting, `${copy.messageLabels[0]}: ${categoryTitle}`, `${copy.messageLabels[1]}: ${region.trim()}`];
    if (description.trim()) lines.push(`${copy.messageLabels[2]}: ${description.trim()}`);
    if (risk) lines.push(`${copy.messageLabels[3]}: ${copy.messageRisk}`);
    lines.push(copy.messageClosing);
    const text = lines.join("\n");
    setMessage(text); setGenerated(text); setReplaceWarning(false); setStatus("generatedLabel"); focusOutput();
  };
  const submit = (event: FormEvent) => { event.preventDefault(); generate(); };
  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(message || ""); setStatus("copiedLabel"); }
    catch { setStatus("copyError"); output.current?.focus(); output.current?.select(); }
  };
  const trackEnquiry = () => trackCtaClick("whatsapp", "Surface repair", { destination: "whatsapp" });
  const directEnquiry = <a className="scheme-a-button scheme-a-button--gold" href={settings.whatsapp_url(copy.genericMessage)} target="_blank" rel="noopener noreferrer" onClick={trackEnquiry}>{copy.primaryAction}<ArrowUpRight size={18} aria-hidden="true" /></a>;
  const focusChapter = (id: string) => document.getElementById(id)?.focus({ preventScroll: true });

  return <main className="fc-route-page fc-surface-repair-page">
    <PageMeta title={seoTitle} description={seoDescription} canonicalPath="/services/surface-repair" ogImage={service.image} />
    <JsonLdService name={title} description={seoDescription} />
    <JsonLdBreadcrumb items={[{ name: common.breadcrumbHome, url: "/" }, { name: common.breadcrumbServices, url: "/services" }, { name: title, url: "/services/surface-repair" }]} />
    <JsonLdFAQ faqs={faqs} />
    <div className="fc-design fc-surface-repair" data-locale={language === "zh" ? "zh-CN" : "en"}>
      <ImmersiveHero className="fcd-design-hero repair-hero" standardPageHero={false} aria-labelledby="repair-hero-title">
        {/* The landscape image covers a tall hero: its source width must also cover the hero height at 1672:941. */}
        <figure className="fcd-design-hero__media"><SmartImage src={service.image || `${imageRoot}hero.webp`} width={1672} height={941} sourceWidth={1672} candidateWidths={[560, 900, 1200, 1600]} critical loading="eager" fetchPriority="high" sizes="max(100vw, 178vh, 1174px)" pictureSources={[{
          media: "(max-width: 767px)",
          srcSet: buildLocalResponsiveSrcSet("/images/services/surface-repair/v20260930/hero-mobile.webp", [360, 560, 720, 900]),
          sizes: "max(100vw, 50svh, 300px)",
        }]} showFailureFallback alt={service.imageAlt || copy.siteHero.imageAlt} /></figure>
        <div className="fcd-design-hero__frame fcd-page-gutter"><div className="fcd-design-hero__copy">
          <p className="fcd-design-hero__location">{copy.regions}</p>
          <h1 id="repair-hero-title">{titleLines.map((line, index) => <span key={line}>{line}{language === "en" && index < titleLines.length - 1 ? " " : ""}</span>)}</h1>
          <p className="fcd-design-hero__lead">{summary}</p>
          <div className="fcd-design-hero__actions"><a className="scheme-a-button scheme-a-button--gold fcd-design-hero__primary" href={settings.whatsapp_url(copy.genericMessage)} target="_blank" rel="noopener noreferrer" onClick={trackEnquiry}>{copy.primaryAction}<ArrowUpRight size={18} aria-hidden="true" /></a><a className="fcd-design-hero__secondary" href="#repair-scope" onClick={() => focusChapter("repair-scope")}>{copy.siteHero.secondaryAction}<ArrowDown size={18} aria-hidden="true" /></a></div>
        </div><span className="fcd-design-hero__credit">{copy.materialLabel}</span></div>
      </ImmersiveHero>
      <nav aria-label={copy.siteHero.sectionNavLabel} className="fcd-page-index fcd-frame">{["repair-scope", "repair-assessment", "repair-process", "repair-consult"].map((id, i) => <a href={`#${id}`} key={id} onClick={() => focusChapter(id)}>{copy.siteHero.navLabels[i]}</a>)}</nav>
      <div className="repair-body">
        <section className="section scope frame" id="repair-scope" tabIndex={-1}>
          <SectionHeading title={copy.scopeTitle} description={stripHtml(service.description) || copy.scopeDescription} />
          <div className="damage-grid">{copy.damageExamples.map((item, index) => <article className="damage-card" key={item.id} aria-labelledby={`damage-${item.id}`}>
            <figure className="damage-photo"><SmartImage src={`${imageRoot}damage-${item.id}.webp`} width={1448} height={1086} sourceWidth={1448} candidateWidths={[360, 560, 900, 1200]} sizes="(min-width: 768px) 48vw, 94vw" loading={index < 2 ? "eager" : "lazy"} showFailureFallback alt={item.alt} /><figcaption>{copy.materialLabel}</figcaption></figure>
            <div className="damage-copy"><p className="damage-condition">{item.condition}</p><h3 id={`damage-${item.id}`}>{item.title}</h3><p className="damage-approach">{item.approach}</p><details className="damage-details"><summary>{copy.exampleDetails}<span className="toggle" aria-hidden="true">+</span></summary><p>{item.boundary}</p></details><button className="text-link" type="button" onClick={() => chooseCategory(item.category, item.title)}>{copy.exampleAction}<ArrowUpRight size={16} aria-hidden="true" /></button></div>
          </article>)}</div>
          <section className="all-scope" aria-labelledby="all-scope-title"><div className="all-scope-heading"><strong id="all-scope-title">{copy.allScopeTitle}</strong><small>{copy.allScopeHint}</small></div><div className="service-grid">{copy.services.map((item, i) => <details className="service" key={item.id}><summary><span className="index">{String(i + 1).padStart(2, "0")}</span><span><span className="name">{item.title}</span><span className="desc">{item.summary}</span></span><span className="toggle" aria-hidden="true">+</span></summary><div className="service-body"><dl>{(["problems", "direction", "boundary"] as const).map((key, n) => <div key={key}><dt>{copy.detailLabels[n]}</dt><dd>{item[key]}</dd></div>)}</dl><button type="button" className="text-link" onClick={() => chooseCategory(item.id)}>{copy.categoryAction}<ArrowUpRight size={16} aria-hidden="true" /></button></div></details>)}</div></section>
        </section>
        <section className="section assessment" id="repair-assessment" tabIndex={-1}>
          <div className="frame">
            <SectionHeading title={copy.assessmentTitle} description={copy.assessmentDescription} />
            <div className="assessment-grid">
              {copy.assessment.map(item => <article className="assessment-item" key={item.title}>
                <header className="assessment-heading">
                  <h3>{item.title}</h3>
                  <span className="assessment-status">{item.label}</span>
                </header>
                <p>{item.description}</p>
                <details className="assessment-detail">
                  <summary>{copy.exampleDetails}<span className="toggle" aria-hidden="true">+</span></summary>
                  <p>{item.details}</p>
                </details>
              </article>)}
            </div>
          </div>
        </section>
        <section className="section frame" id="repair-process" tabIndex={-1}><SectionHeading title={copy.processTitle} description={copy.processDescription} /><ol className="process-grid">{steps.map((item, i) => <li key={i}><span className="step-index">{String(i + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.desc}</p></li>)}</ol><p className="situations">{copy.situations}</p><section className="price"><SectionHeading title={copy.priceTitle} /><div className="triple">{copy.priceFactors.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section></section>
        {faqs.length > 0 && <section className="section faq-section frame"><SectionHeading title={copy.faqTitle} />{faqs.map(item => <details className="faq" key={item.question}><summary>{item.question}<span className="toggle" aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</section>}
        <section className="section consult" id="repair-consult" tabIndex={-1}><div className="frame consult-layout"><div><SectionHeading title={copy.consultTitle} description={copy.consultDescription} /><ol className="photo-list">{copy.photoGuide.map((item, i) => { const Icon = photoIcons[i]; return <li key={item.title}><div className="photo-visual"><span className="photo-index">{String(i + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /></div><strong>{item.title}</strong><p>{item.description}</p></li>; })}</ol></div>
          <div className="consult-panel">{directEnquiry}<details className="tool" ref={tool}><summary>{copy.toolTitle}</summary><p>{copy.toolNote}</p>
            <form onSubmit={submit} noValidate>
              <label htmlFor="repair-category">{copy.categoryLabel}</label><select id="repair-category" ref={categoryInput} value={category} onChange={event => { setCategory(event.target.value); if (description === suggestedDamage.current) setDescription(""); suggestedDamage.current = ""; markChanged(); }}><option value="">{copy.unknownCategory}</option>{copy.services.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <label htmlFor="repair-region">{copy.regionLabel}</label><Input id="repair-region" ref={regionInput} value={region} required maxLength={100} placeholder={copy.regionPlaceholder} aria-invalid={regionError || undefined} aria-describedby={regionError ? "repair-region-error" : undefined} onChange={event => { setRegion(event.target.value); setRegionError(false); markChanged(); }} />{regionError && <p id="repair-region-error" className="error" role="alert">{copy.regionError}</p>}
              <label htmlFor="repair-description">{copy.descriptionLabel}</label><Textarea id="repair-description" value={description} maxLength={1000} placeholder={copy.descriptionPlaceholder} onChange={event => { setDescription(event.target.value); markChanged(); }} />
              <label className="check"><input type="checkbox" checked={risk} onChange={event => { setRisk(event.target.checked); markChanged(); }} />{copy.riskLabel}</label>{risk && <p className="notice" role="status">{copy.riskNotice}</p>}<button className="generate" type="submit">{copy.generateLabel}<ArrowUpRight size={16} aria-hidden="true" /></button>
            </form>
            {message !== null && <div className="result">{replaceWarning && <div className="replace-warning" role="group" aria-labelledby="repair-replace-note"><p id="repair-replace-note">{copy.replaceNotice}</p><div className="actions"><button className="secondary" type="button" ref={keepButton} onClick={() => { setReplaceWarning(false); setStatus("keptLabel"); focusOutput(); }}>{copy.keepLabel}</button><button className="secondary" type="button" onClick={() => generate(true)}>{copy.replaceLabel}</button></div></div>}<label htmlFor="repair-message">{copy.outputLabel}</label><Textarea id="repair-message" ref={output} value={message} onChange={event => { setMessage(event.target.value); setReplaceWarning(false); setStatus("editedLabel"); }} /><div className="actions"><button className="secondary" type="button" onClick={() => void copyMessage()}>{copy.copyLabel}</button><a className="secondary" href={settings.whatsapp_url(message)} target="_blank" rel="noopener noreferrer" onClick={trackEnquiry}>{copy.openWhatsAppLabel}<ArrowUpRight size={16} aria-hidden="true" /></a></div><p className="status" role="status">{copy[status]}</p></div>}
          </details></div>
        </div></section>
        <section className="related frame"><SectionHeading title={copy.relatedTitle} description={copy.relatedDescription} /><nav aria-label={copy.relatedTitle}>{copy.related.map(item => <Link key={item.path} to={item.path}>{item.title}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}</nav></section>
      </div>
    </div>
  </main>;
}
