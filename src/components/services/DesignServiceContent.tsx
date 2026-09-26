import { useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import ImmersiveHero from "@/components/ImmersiveHero";
import { SchemeAFaqList, SchemeAFilter, SchemeANumberList } from "@/components/scheme-a/SchemeARoutePrimitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { designServicePageText } from "@/i18n/designServicePageText";
import { serviceDetailPageText } from "@/i18n/serviceDetailPageText";
import { buildQuotePath } from "@/lib/quoteContext";
import "@/styles/design-service.css";
type Study = "concept" | "plan" | "detail";
type Material = "wood" | "stone" | "linen" | "bronze";
type Project = "courtyard" | "reading";
function DesignSectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return <header className="fcd-section-heading fc-route-section-head scheme-a-heading scheme-a-heading--split">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </header>;
}

/** Design body only; App owns all current public chrome and contact configuration. */
export default function DesignServiceContent() {
    const { language } = useLanguage();
    const copy = designServicePageText[language];
    const serviceCopy = serviceDetailPageText[language];
    const [study, setStudy] = useState<Study>("concept");
    const [material, setMaterial] = useState<Material>("wood");
    const [materialTouched, setMaterialTouched] = useState(false);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const projectOpener = useRef<HTMLAnchorElement | null>(null);
    const links = {
        quote: buildQuotePath({ source: "service", title: copy.serviceName }),
        projects: "/projects", materials: "/materials", services: "/services",
    };
    const studyDetails = {
        concept: { title: copy.designReasons3, description: copy.designReasons4 },
        plan: { title: copy.designReasons, description: copy.designReasons2 },
        detail: { title: copy.designReasons5, description: copy.designReasons6 },
    };
    const materials: Array<{ value: Material; label: string }> = [
        { value: "wood", label: copy.active }, { value: "stone", label: copy.materialSelector },
        { value: "linen", label: copy.materialSelector2 }, { value: "bronze", label: copy.materialSelector3 },
    ];
    const services = [
        { title: copy.serviceItem, description: copy.serviceContent },
        { title: copy.serviceItem2, description: copy.serviceContent2 },
        { title: copy.serviceItem3, description: copy.serviceContent3 },
        { title: copy.serviceItem4, description: copy.serviceContent4 },
    ];
    const process = [
        { title: copy.processGrid, description: copy.processGrid2 },
        { title: copy.processGrid3, description: copy.processGrid4 },
        { title: copy.processGrid5, description: copy.processGrid6 },
        { title: copy.processGrid7, description: copy.processGrid8 },
        { title: copy.processGrid9, description: copy.processGrid10 },
        { title: copy.processGrid11, description: copy.processGrid12 },
    ];
    const materialTitles = { wood: copy.woodMaterialTitle, stone: copy.stoneMaterialTitle, linen: copy.linenMaterialTitle, bronze: copy.bronzeMaterialTitle };
    const projectDetails = { courtyard: { title: copy.courtyardTitle, category: copy.courtyardCategory, description: copy.courtyardDescription, alt: copy.courtyardImageAlt, src: "/images/services/design/space-1200.webp", width: 1200, height: 800 },
        reading: { title: copy.readingTitle, category: copy.readingCategory, description: copy.readingDescription, alt: copy.readingImageAlt, src: "/images/services/design/reading.webp", width: 860, height: 912 } };
    const selectedProject = activeProject ? projectDetails[activeProject] : null;
    const faqs = [{ question: copy.faqQuestion1, answer: copy.faqAnswer1 },
        { question: copy.faqQuestion2, answer: copy.faqAnswer2 },
        { question: copy.faqQuestion3, answer: copy.faqAnswer3 },
        { question: copy.faqQuestion4, answer: copy.faqAnswer4 }];
    const openProject = (event: MouseEvent<HTMLAnchorElement>, key: Project) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
        event.preventDefault();
        projectOpener.current = event.currentTarget;
        setActiveProject(key);
    };
    return (<main className="fc-route-page fc-design-service-page">
      <PageMeta title={copy.metaTitle} description={copy.metaDescription} canonicalPath="/services/design" ogImage="/images/services/design/space-1200.webp"/>
      <JsonLdService name={copy.serviceName} description={copy.metaDescription}/>
      <JsonLdBreadcrumb items={[{ name: serviceCopy.breadcrumbHome, url: "/" }, { name: serviceCopy.breadcrumbServices, url: "/services" }, { name: copy.serviceName, url: "/services/design" }]}/>
      <JsonLdFAQ faqs={faqs}/>
      <div data-enhanced="true" data-dialog-ready="true" className="fc-design fc-design-integrated" data-locale={language === "zh" ? "zh-CN" : "en"} id="fc-design-root">
    <ImmersiveHero className="fcd-design-hero" standardPageHero={false} aria-labelledby="fcd-hero-heading">
      <figure className="fcd-design-hero__media">
        <SmartImage showFailureFallback
          src="/images/services/design/space.webp"
          alt={copy.courtyardImageAlt}
          width={1536}
          height={1024}
          critical
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 767px) 1100px, 100vw"
          pictureSources={[{
            srcSet: "/images/services/design/space-768.webp 768w, /images/services/design/space-1200.webp 1200w, /images/services/design/space.webp 1536w",
            sizes: "(max-width: 767px) 1100px, 100vw",
          }]}
        />
      </figure>
      <div className="fcd-design-hero__frame fcd-page-gutter">
        <div className="fcd-design-hero__copy">
          <p className="fcd-design-hero__location">{copy.heroLocation}</p>
          <h1 id="fcd-hero-heading">
            <span>{copy.heroServiceTitle}</span>
            {" "}
            <span>{copy.heroServiceTitle2}</span>
          </h1>
          <p className="fcd-design-hero__lead">{copy.heroLead}</p>
          <div className="fcd-design-hero__actions">
            <Link className="scheme-a-button scheme-a-button--gold fcd-design-hero__primary" data-fcd-link="quote" to={links.quote}>
              {copy.button}<ArrowUpRight aria-hidden="true" size={18} />
            </Link>
            <a className="fcd-design-hero__secondary" href="#fcd-works">
              {copy.textLink}<span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <a
          className="fcd-design-hero__credit"
          aria-controls="fcd-project-dialog"
          aria-haspopup="dialog"
          aria-label={copy.imageExploreAriaLabel}
          href="#fcd-concept-courtyard"
          onClick={(event) => openProject(event, "courtyard")}
        >
          {copy.conceptLabel}<ArrowUpRight aria-hidden="true" size={15} />
        </a>
      </div>
    </ImmersiveHero>
    <nav aria-label={copy.pageIndexAriaLabel} className="fcd-page-index fcd-frame">
      <a href="#fcd-works">{copy.pageIndex}</a>
      <a href="#fcd-approach">{copy.pageIndex2}</a>
      <a href="#fcd-materials">{copy.pageIndex3}</a>
      <a href="#fcd-services">{copy.pageIndex4}</a>
    </nav>
    <section data-cinematic-section aria-labelledby="fcd-works-title" className="fcd-works fcd-page-gutter fcd-section-space" id="fcd-works">
    <div className="fcd-section-bar">
      <DesignSectionHeading id="fcd-works-title" title={copy.worksTitle} description={copy.worksSummary} />
      <Link className="fcd-text-link" data-fcd-link="projects" to={links.projects}>
        {copy.textLink2}<ArrowUpRight aria-hidden="true" size={18} />
      </Link>
    </div>
    <div className="fcd-project-grid">
    <article className="fcd-project-card fcd-project-large fcd-reveal">
    <div className="fcd-project-image">
    <SmartImage showFailureFallback alt={copy.projectImageAlt} decoding="async" height={800} loading="lazy" sizes="(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" src="/images/services/design/space-1200.webp" width={1200} pictureSources={[{ srcSet: "/images/services/design/space-480.webp 480w, /images/services/design/space-768.webp 768w, /images/services/design/space-1200.webp 1200w, /images/services/design/space.webp 1536w", sizes: "(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" }]}/>
    <a aria-controls="fcd-project-dialog" aria-haspopup="dialog" aria-label={copy.projectImageAriaLabel} className="fcd-project-open" data-project="courtyard" href="#fcd-concept-courtyard" onClick={(event) => openProject(event, "courtyard")}>
    <span className="fcd-project-badge">
    {copy.captionKind}
    </span>
    <span aria-hidden="true" className="fcd-project-circle">
    {"↗"}
    </span>
    </a>
    </div>
    <div className="fcd-project-caption">
    <div>
    <h3>
    {copy.courtyardTitle}
    </h3>
    <p>
    {copy.projectCaption}
    </p>
    </div>
    </div>
    </article>
    <article className="fcd-project-card fcd-project-small fcd-reveal">
    <div className="fcd-project-image">
    <SmartImage showFailureFallback alt={copy.readingImageAlt} decoding="async" height={912} loading="lazy" sizes="(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" src="/images/services/design/reading.webp" width={860} pictureSources={[{ srcSet: "/images/services/design/reading-480.webp 480w, /images/services/design/reading.webp 860w", sizes: "(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" }]}/>
    <a aria-controls="fcd-project-dialog" aria-haspopup="dialog" aria-label={copy.projectImageAriaLabel2} className="fcd-project-open" data-project="reading" href="#fcd-concept-reading" onClick={(event) => openProject(event, "reading")}>
    <span className="fcd-project-badge">
    {copy.captionKind}
    </span>
    <span aria-hidden="true" className="fcd-project-circle">
    {"↗"}
    </span>
    </a>
    </div>
    <div className="fcd-project-caption">
    <div>
    <h3>
    {copy.readingTitle}
    </h3>
    <p>
    {copy.projectCaption2}
    </p>
    </div>
    </div>
    </article>
    </div>
    <section aria-label={copy.fallbackStudiesAriaLabel} className="fcd-fallback-studies fcd-page-gutter">
    <article data-project-detail="courtyard" id="fcd-concept-courtyard">
    <p className="fcd-eyebrow" data-project-category="">
    {copy.courtyardCategory}
    </p>
    <h3 data-project-title="">
    {copy.courtyardTitle}
    </h3>
    <p data-project-text="">
    {copy.courtyardDescription}
    </p>
    <p className="fcd-scope-note">
    {copy.scopeNote}
    </p>
    </article>
    <article data-project-detail="reading" id="fcd-concept-reading">
    <p className="fcd-eyebrow" data-project-category="">
    {copy.readingCategory}
    </p>
    <h3 data-project-title="">
    {copy.readingTitle}
    </h3>
    <p data-project-text="">
    {copy.readingDescription}
    </p>
    <p className="fcd-scope-note">
    {copy.scopeNote}
    </p>
    </article>
    </section>
    </section>
    <section data-cinematic-section aria-labelledby="fcd-approach-title" className="fcd-approach fcd-page-gutter fcd-section-space" id="fcd-approach">
    <Tabs value={study} onValueChange={(value) => setStudy(value as Study)} className="fcd-feature-grid fcd-approach-grid">
    <DesignSectionHeading id="fcd-approach-title" title={copy.approachTitle} description={copy.approachSummary} />
    <TabsList aria-label={copy.studyTabsAriaLabel} className="fcd-study-tabs">
      <TabsTrigger value="concept">{copy.tabConcept}</TabsTrigger>
      <TabsTrigger value="plan">{copy.tabPlan}</TabsTrigger>
      <TabsTrigger value="detail">{copy.tabDetail}</TabsTrigger>
    </TabsList>
    <div className="fcd-study-visual" data-view={study}>
    <TabsContent value="concept" className="fcd-study-panel">
    <SmartImage showFailureFallback alt={copy.panelConceptAlt} decoding="async" height={800} loading="eager" fetchPriority="auto" sizes="(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" src="/images/services/design/space-1200.webp" width={1200} pictureSources={[{ srcSet: "/images/services/design/space-480.webp 480w, /images/services/design/space-768.webp 768w, /images/services/design/space-1200.webp 1200w, /images/services/design/space.webp 1536w", sizes: "(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" }]}/>
    <span className="fcd-study-image-label">
    {copy.studyImageLabel}
    </span>
    </TabsContent>
    <TabsContent value="plan" className="fcd-study-panel fcd-plan-panel">
    <svg aria-label={copy.panelPlanAriaLabel} role="img" viewBox="40 58 700 490">
    <defs>
    <pattern height={22} id="fcd-planGrid" patternUnits="userSpaceOnUse" width={22}>
    <path d="M22 0H0V22" fill="none" stroke="#d5d1c4" strokeWidth=".35">

    </path>
    </pattern>
    <pattern height={36} id="fcd-planWood" patternUnits="userSpaceOnUse" width={18}>
    <rect fill="#e2d9c7" height={36} width={18}>

    </rect>
    <path d="M0 0V36M18 0H0" stroke="#bcb19b" strokeWidth=".4">

    </path>
    </pattern>
    </defs>
    <rect fill="#ece8dc" height={590} width={780}>

    </rect>
    <rect fill="url(#fcd-planGrid)" height={540} width={720} x="30" y="25">

    </rect>
    <g fill="none" stroke="#6b7161" strokeWidth="1.1">
    <path d="M90 150V83H684V500H90V255" strokeWidth="6">

    </path>
    <path d="M90 150v103M98 150v103">

    </path>
    <path d="M467 84V262H684M467 360v139" strokeWidth="4">

    </path>
    <path d="M290 84v126M290 308v191" strokeWidth="4">

    </path>
    </g>
    <rect fill="#d4d8c7" height={156} width={193} x="479" y="95">

    </rect>
    <g fill="#bbc7a8" stroke="#7f916d" strokeWidth="1">
    <circle cx="595" cy="164" r="54">

    </circle>
    <circle cx="631" cy="115" r="25">

    </circle>
    <circle cx="520" cy="220" r="22">

    </circle>
    <circle cx="512" cy="128" r="16">

    </circle>
    </g>
    <path d="M595 214v-105m-31 68 32-28 31 8" fill="none" stroke="#839376" strokeWidth="1.6">

    </path>
    <rect fill="url(#fcd-planWood)" height={164} width={175} x="103" y="322">

    </rect>
    <g fill="#e8dfce" stroke="#7f8071" strokeWidth="1.2">
    <rect height={181} rx="10" width={46} x="317" y="152">

    </rect>
    <path d="M330 158V323">

    </path>
    <rect height={91} rx="27" width={61} x="380" y="217">

    </rect>
    <rect height={37} rx="4" width={133} x="311" y="445">

    </rect>
    <rect height={54} rx="19" width={54} x="164" y="358">

    </rect>
    <circle cx="145" cy="432" r="17">

    </circle>
    <rect height={109} rx="40" width={92} x="528" y="335">

    </rect>
    </g>
    <g fill="#bbbba7" stroke="#797d69">
    <rect height={27} rx="5" width={13} x="514" y="350">

    </rect>
    <rect height={27} rx="5" width={13} x="514" y="403">

    </rect>
    <rect height={27} rx="5" width={13} x="623" y="350">

    </rect>
    <rect height={27} rx="5" width={13} x="623" y="403">

    </rect>
    </g>
    <path d="M64 217H225Q254 217 254 249V276H391Q475 276 475 303V376H493" fill="none" stroke="#aa7e57" strokeDasharray="7 6" strokeWidth="2.2">

    </path>
    <path d="M486 371l9 5-9 5" fill="none" stroke="#aa7e57" strokeWidth="2">

    </path>
    <g className="fcd-plan-room-labels" fill="#384231" fontSize="22" textAnchor="middle">
    <text x="187" y="292">
    {copy.panelPlan}
    </text>
    <text x="384" y="389">
    {copy.panelPlan2}
    </text>
    <text x="183" y="470">
    {copy.panelPlan3}
    </text>
    <text x="578" y="474">
    {copy.panelPlan4}
    </text>
    <text x="576" y="237">
    {copy.panelPlan5}
    </text>
    </g>
    </svg>
    <span className="fcd-study-image-label">{copy.panelPlan7}</span>
    <p className="fcd-plan-legend">
    {copy.planLegend}
    </p>
    </TabsContent>
    <TabsContent value="detail" className="fcd-study-panel">
    <SmartImage showFailureFallback alt={copy.panelDetailAlt} decoding="async" height={481} loading="eager" fetchPriority="auto" sizes="(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" src="/images/services/design/detail.webp" width={891} pictureSources={[{ srcSet: "/images/services/design/detail-480.webp 480w, /images/services/design/detail.webp 891w", sizes: "(max-width: 767px) calc(100vw - 44px), (max-width: 1100px) 52vw, 720px" }]}/>
    <span className="fcd-study-image-label">
    {copy.studyImageLabel2}
    </span>
    </TabsContent>
    </div>
    <div className="fcd-study-copy fcd-feature-copy" aria-live="polite" aria-atomic="true">
      <h3>{studyDetails[study].title}</h3>
      <p>{studyDetails[study].description}</p>
    </div>
    </Tabs>
    </section>
    <section data-cinematic-section aria-labelledby="fcd-materials-title" className="fcd-materials fcd-page-gutter fcd-section-space" id="fcd-materials">
    <div className="fcd-feature-grid fcd-material-grid">
    <DesignSectionHeading id="fcd-materials-title" title={copy.materialsTitle} description={copy.materialsSummary} />
    <div className="fcd-feature-controls">
      <SchemeAFilter items={materials} value={material} ariaLabel={copy.materialSelectorAriaLabel}
        onChange={(value) => { setMaterial(value as Material); setMaterialTouched(true); }} />
    </div>
    <figure aria-label={copy.materialArtAriaLabel} className="fcd-material-board fcd-reveal">
      <div className="fcd-material-board__image">
        <SmartImage showFailureFallback
          alt={copy.materialBoardAlt}
          src="/images/services/design/material-board-v2-1200.webp"
          width={1200}
          height={1200}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1100px) 52vw, 720px"
          pictureSources={[{
            srcSet: "/images/services/design/material-board-v2-480.webp 480w, /images/services/design/material-board-v2-768.webp 768w, /images/services/design/material-board-v2-1200.webp 1200w",
            sizes: "(max-width: 767px) calc(100vw - 32px), (max-width: 1100px) 52vw, 720px",
          }]}
        />
        <button className="fcd-material-pin fcd-material-pin--wood" aria-controls="fcd-material-wood" aria-label={copy.materialSampleAriaLabel2} aria-pressed={material === "wood"} type="button" onClick={() => { setMaterial("wood"); setMaterialTouched(true); }}>01</button>
        <button className="fcd-material-pin fcd-material-pin--stone" aria-controls="fcd-material-stone" aria-label={copy.materialSampleAriaLabel3} aria-pressed={material === "stone"} type="button" onClick={() => { setMaterial("stone"); setMaterialTouched(true); }}>02</button>
        <button className="fcd-material-pin fcd-material-pin--linen" aria-controls="fcd-material-linen" aria-label={copy.materialSampleAriaLabel} aria-pressed={material === "linen"} type="button" onClick={() => { setMaterial("linen"); setMaterialTouched(true); }}>03</button>
        <button className="fcd-material-pin fcd-material-pin--bronze" aria-controls="fcd-material-bronze" aria-label={copy.materialSampleAriaLabel4} aria-pressed={material === "bronze"} type="button" onClick={() => { setMaterial("bronze"); setMaterialTouched(true); }}>04</button>
      </div>
      <figcaption>{copy.deskNote}</figcaption>
    </figure>
    <div className="fcd-material-copy fcd-feature-copy">
    <div className="fcd-material-description">
    <section aria-labelledby="fcd-material-title-wood" data-material-panel="wood" id="fcd-material-wood" hidden={material !== "wood"}>
    <h3 id="fcd-material-title-wood">
    {copy.woodMaterialTitle}
    </h3>
    <p>
    {copy.materialWood}
    </p>
    </section>
    <section aria-labelledby="fcd-material-title-stone" data-material-panel="stone" id="fcd-material-stone" hidden={material !== "stone"}>
    <h3 id="fcd-material-title-stone">
    {copy.stoneMaterialTitle}
    </h3>
    <p>
    {copy.materialStone}
    </p>
    </section>
    <section aria-labelledby="fcd-material-title-linen" data-material-panel="linen" id="fcd-material-linen" hidden={material !== "linen"}>
    <h3 id="fcd-material-title-linen">
    {copy.linenMaterialTitle}
    </h3>
    <p>
    {copy.materialLinen}
    </p>
    </section>
    <section aria-labelledby="fcd-material-title-bronze" data-material-panel="bronze" id="fcd-material-bronze" hidden={material !== "bronze"}>
    <h3 id="fcd-material-title-bronze">
    {copy.bronzeMaterialTitle}
    </h3>
    <p>
    {copy.materialBronze}
    </p>
    </section>
    </div>
    <span aria-atomic="true" aria-live="polite" className="fcd-sr-only" role="status">{materialTouched ? materialTitles[material] : ""}</span>
    <Link className="fcd-text-link fcd-material-link" data-fcd-link="materials" to={links.materials}>
    {copy.textLink3}
    <span>
    {"↗"}
    </span>
    </Link>
    </div>
    </div>
    </section>
    <section data-cinematic-section aria-labelledby="fcd-services-title" className="fcd-services fcd-text-module fcd-page-gutter fcd-section-space" id="fcd-services">
    <DesignSectionHeading id="fcd-services-title" title={copy.servicesTitle} description={copy.servicesSummary} />
    <div className="fcd-service-grid">
      {services.map((service) => <article key={service.title}>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </article>)}
    </div>
    </section>
    <section data-cinematic-section aria-labelledby="fcd-process-title" className="fcd-process fcd-text-module fcd-page-gutter fcd-section-space" id="fcd-process">
    <DesignSectionHeading id="fcd-process-title" title={copy.processTitle} description={copy.processSummary} />
    <SchemeANumberList items={process} />
    </section>
    <section data-cinematic-section aria-labelledby="fcd-faq-title" className="fcd-faq-section fcd-text-module fcd-page-gutter fcd-section-space">
    <DesignSectionHeading id="fcd-faq-title" title={copy.faqTitle} description={copy.faqSummary} />
    <SchemeAFaqList items={faqs} />
    </section>

    </div>
      <Dialog open={activeProject !== null} onOpenChange={(open) => { if (!open)
        setActiveProject(null); }}>
        <DialogContent id="fcd-project-dialog" className="fc-design fcd-integrated-dialog" closeLabel={copy.closeConcept} onCloseAutoFocus={(event) => { event.preventDefault(); projectOpener.current?.focus({ preventScroll: true }); }}>
          {selectedProject && <>
            <div className="fcd-dialog-media"><SmartImage showFailureFallback src={selectedProject.src} alt={selectedProject.alt} width={selectedProject.width} height={selectedProject.height} loading="eager" className="fcd-dialog-image"/></div>
            <div className="fcd-project-dialog-body">
              <p className="fcd-eyebrow">{selectedProject.category}</p>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>{selectedProject.description}</DialogDescription>
              <p className="fcd-dialog-note">{copy.conceptDisclosure}</p>
              <Link className="fcd-text-link" to={links.quote}>{copy.discussYourSpace}<ArrowUpRight aria-hidden="true"/></Link>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </main>);
}
