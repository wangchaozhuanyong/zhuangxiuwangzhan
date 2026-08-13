import { ForestContentState } from "@/components/forest/ForestPagePrimitives";

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
    <main className="forest-state-page pt-site-header">
      <div className="forest-page-frame">
        <ForestContentState variant="loading" label={label} title={title} description={description} />
      </div>
    </main>
  );
};

export default PublicLoadingState;
