import PageMeta from '@/components/PageMeta';
import LocalizedLink from '@/components/LocalizedLink';
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from '@/components/JsonLd';
import CabinetStudio from '@/components/cabinets/CabinetStudio';
import { usePageConsultation } from '@/contexts/PublicChromeContext';
import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/customCabinetsText.json';
import studioText from '@/i18n/cabinetStudioText.json';
import '@/styles/components/cabinet-studio.css';

export default function CustomCabinets() {
  usePageConsultation();
  const { language } = useLanguage(); const copy = text[language]; const t = studioText[language];
  return <main className="fc-route-page cabinet-page cabinet-page--studio">
    <PageMeta title={copy.metaTitle} description={copy.metaDescription} canonicalPath="/custom-cabinets" ogImage="/images/custom-cabinets/v2/modern-1-kitchen.webp" />
    <JsonLdBreadcrumb items={[{ name: copy.home, url: '/' }, { name: copy.eyebrow, url: '/custom-cabinets' }]} />
    <JsonLdService name={copy.eyebrow} description={copy.metaDescription} />
    <JsonLdFAQ faqs={copy.faqs} />
    <div className="scheme-a-frame"><CabinetStudio />
      <div className="studio-support"><details><summary>{t.materials}</summary><div className="studio-support__body">{copy.materialItems.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}<LocalizedLink to="/materials/category/whole-house-custom">{t.materialLink}</LocalizedLink><LocalizedLink to="/services/builtin">{t.serviceLink}</LocalizedLink></div></details><details><summary>{t.process}</summary><div className="studio-support__body">{copy.process.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}{copy.faqs.map(item => <article key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div></details></div>
    </div>
  </main>;
}
