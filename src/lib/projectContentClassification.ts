type ProjectMediaRecord = {
  image?: string;
  image_url?: string;
  images?: readonly string[];
  thumbnail?: string;
  title?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  clientNeed?: string;
  title_en?: string;
  title_zh?: string;
  excerpt_en?: string;
  excerpt_zh?: string;
  content_en?: string;
  content_zh?: string;
  client_need_en?: string;
  client_need_zh?: string;
};

const RENDERING_PATH_MARKERS = ["/generated-portfolio/", "/rendering-concept/", "/design-concepts/"] as const;
const RENDERING_TEXT_MARKERS = [
  /\brendering concepts?\b/i,
  /\bdesign concepts?\b/i,
  /\bnot (?:a )?completed customer project\b/i,
  /\bnot (?:a )?completed project\b/i,
  /效果图概念/,
  /设计概念/,
  /规划概念/,
  /不(?:是|代表)真实完工项目/,
] as const;

export const isRenderingConceptImage = (src?: string | null) => {
  const normalized = String(src || "").trim().toLowerCase();
  return Boolean(normalized) && RENDERING_PATH_MARKERS.some((marker) => normalized.includes(marker));
};

const isRenderingConceptText = (value?: string | null) => {
  const normalized = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return Boolean(normalized) && RENDERING_TEXT_MARKERS.some((pattern) => pattern.test(normalized));
};

export const isRenderingConceptProject = (project?: ProjectMediaRecord | null) => {
  if (!project) return false;
  const images = [project.image, project.image_url, project.thumbnail, ...(project.images || [])];
  if (images.some((image) => isRenderingConceptImage(image))) return true;

  const content = [
    project.title,
    project.description,
    project.excerpt,
    project.content,
    project.clientNeed,
    project.title_en,
    project.title_zh,
    project.excerpt_en,
    project.excerpt_zh,
    project.content_en,
    project.content_zh,
    project.client_need_en,
    project.client_need_zh,
  ];
  return content.some((value) => isRenderingConceptText(value));
};
