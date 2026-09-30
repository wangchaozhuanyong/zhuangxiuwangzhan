import { Skeleton } from "@/components/ui/skeleton";
import { SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { blogDetailPageText } from "@/i18n/blogDetailPageText";
import "@/styles/routes/blog.css";

export const BlogContentSkeleton = () => (
  <div className="blog-content-loading" aria-hidden="true">
    <Skeleton className="blog-content-loading__heading" />
    <Skeleton className="blog-content-loading__line" />
    <Skeleton className="blog-content-loading__line" />
    <Skeleton className="blog-content-loading__line blog-content-loading__line--short" />
    <Skeleton className="blog-content-loading__image" />
  </div>
);

export default function BlogArticleLoading() {
  const { language } = useLanguage();
  return (
    <main className="fc-route-page fc-route-article-page blog-loading-page" role="status" aria-busy="true" data-route-pending="true">
      <span className="sr-only">{blogDetailPageText[language].loadingTitle}</span>
      <div className="scheme-a-frame blog-loading-hero" aria-hidden="true">
        <Skeleton className="blog-loading-hero__image" />
        <div className="blog-loading-hero__copy">
          <Skeleton className="blog-content-loading__heading" />
          <Skeleton className="blog-content-loading__line" />
          <Skeleton className="blog-content-loading__line blog-content-loading__line--short" />
        </div>
      </div>
      <SchemeASection className="fc-route-editorial">
        <div className="blog-editorial-layout"><BlogContentSkeleton /></div>
      </SchemeASection>
    </main>
  );
}
