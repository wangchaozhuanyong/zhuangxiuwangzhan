type ProjectMediaRecord = {
  image?: string;
  image_url?: string;
  images?: readonly string[];
  thumbnail?: string;
};

const RENDERING_PATH_MARKERS = ["/generated-portfolio/", "/rendering-concept/", "/design-concepts/"] as const;

export const isRenderingConceptImage = (src?: string | null) => {
  const normalized = String(src || "").trim().toLowerCase();
  return Boolean(normalized) && RENDERING_PATH_MARKERS.some((marker) => normalized.includes(marker));
};

export const isRenderingConceptProject = (project?: ProjectMediaRecord | null) => {
  if (!project) return false;
  const images = [project.image, project.image_url, project.thumbnail, ...(project.images || [])];
  return images.some((image) => isRenderingConceptImage(image));
};
