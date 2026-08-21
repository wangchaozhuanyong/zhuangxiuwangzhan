import { ForestContentState } from "@/components/forest/ForestPagePrimitives";

interface PublicLoadingStateProps {
  label?: string;
  title?: string;
  description?: string;
  variant?: "default" | "product";
}

const PublicLoadingState = ({
  label = "FLASH CAST",
  title = "Loading content",
  description = "Preparing the page experience for you.",
  variant = "default",
}: PublicLoadingStateProps) => {
  if (variant === "product") {
    return (
      <main className="product-loading-state" role="status" aria-live="polite" aria-busy="true">
        <header className="product-loading-state__status">
          <span>{label}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className="product-loading-state__opening" aria-hidden="true">
          <div className="product-loading-state__media">
            <span className="product-loading-state__image" />
            <span className="product-loading-state__thumbs"><i /><i /><i /></span>
          </div>
          <div className="product-loading-state__copy">
            <span className="product-loading-state__eyebrow" />
            <span className="product-loading-state__title" />
            <span className="product-loading-state__price" />
            <span className="product-loading-state__line" />
            <span className="product-loading-state__line product-loading-state__line--short" />
            <span className="product-loading-state__specs"><i /><i /><i /></span>
            <span className="product-loading-state__actions"><i /><i /></span>
          </div>
        </div>
        <div className="product-loading-state__details" aria-hidden="true">
          <span className="product-loading-state__section-title" />
          <div><i /><i /><i /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="forest-state-page pt-site-header">
      <div className="forest-page-frame">
        <ForestContentState variant="loading" label={label} title={title} description={description} />
      </div>
    </main>
  );
};

export default PublicLoadingState;
