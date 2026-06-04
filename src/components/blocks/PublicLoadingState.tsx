interface PublicLoadingStateProps {
  label?: string;
  title?: string;
  description?: string;
}

const PublicLoadingState = ({
  label = "FLASH CAST",
  title = "Loading content",
  description = "Preparing the page experience for you.",
}: PublicLoadingStateProps) => {
  return (
    <main className="pt-site-header">
      <section className="public-loading-state section-padding">
        <div className="container-narrow">
          <div className="public-loading-state__panel" role="status" aria-live="polite">
            <span className="public-loading-state__label">{label}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="public-loading-state__bar" aria-hidden="true" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default PublicLoadingState;
