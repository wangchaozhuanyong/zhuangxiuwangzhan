export const adminMediaLibraryText = {
  created: { en: "Media record created", zh: "媒体记录已创建" },
  saved: { en: "Media information saved", zh: "媒体信息已保存" },
  deleted: { en: "Media record deleted", zh: "媒体记录已删除" },
  deleteToastDescription: {
    en: "This only deletes the admin media record. It does not automatically delete the actual uploaded file.",
    zh: "这里只删除后台媒体记录，不会自动删除已经上传的真实文件。",
  },
  copied: { en: "Link copied", zh: "链接已复制" },
  copyFailed: { en: "Copy failed. Please copy the image URL manually.", zh: "复制失败，请手动复制图片地址。" },
  title: { en: "Media Library", zh: "媒体库" },
  description: {
    en: "Centrally manage uploaded images, videos, usage categories, and alt text.",
    zh: "集中管理上传图片、视频、用途分类和说明文字。",
  },
  helpText: {
    en: "Images uploaded here automatically generate frontend display versions and record size, dimensions, and format so the client does not load oversized originals directly.",
    zh: "这里上传的图片会自动生成前台展示版本，并记录尺寸、大小和格式，避免客户端直接加载过大的原始素材。",
  },
  uploadInfo: {
    en: "Image uploads automatically generate WebP display images. Originals are saved in the private original bucket when possible. Frontend pages use SmartImage to load suitable sizes by screen.",
    zh: "图片上传后会自动生成 WebP 展示图，原图会尽量保存在私有原图桶里；前台页面通过 SmartImage 按屏幕加载合适尺寸。",
  },
  uploadVideo: { en: "Upload video", zh: "上传视频" },
  searchPlaceholder: {
    en: "Search file name, alt text, category...",
    zh: "搜索文件名、图片说明、分类...",
  },
  generic: { en: "General", zh: "通用" },
  unknownFormat: { en: "Unknown format", zh: "未知格式" },
  originalKept: { en: "Original kept: {size}", zh: "原图已保留：{size}" },
  copyLink: { en: "Copy link", zh: "复制链接" },
  edit: { en: "Edit", zh: "编辑" },
  deleteRecord: { en: "Delete record", zh: "删除记录" },
  itemLabel: { en: "media items", zh: "个媒体" },
  editDialogTitle: { en: "Edit media information", zh: "编辑媒体信息" },
  folderPlaceholder: { en: "Folder", zh: "文件夹" },
  altZhPlaceholder: { en: "Chinese image description", zh: "中文图片说明" },
  altEnPlaceholder: { en: "English image description", zh: "英文图片说明" },
  cancel: { en: "Cancel", zh: "取消" },
  saving: { en: "Saving...", zh: "保存中..." },
  save: { en: "Save", zh: "保存" },
  confirmDeleteTitle: { en: "Delete media record?", zh: "确认删除媒体记录？" },
  confirmDeleteDescription: {
    en: "This only deletes the record in the admin media library. It does not automatically delete the actual file already uploaded to the storage bucket. Confirm that frontend pages no longer depend on this media record before deleting.",
    zh: "这一步只删除后台媒体库里的记录，不会自动删除已经上传到存储桶的真实文件。删除前请确认前台页面没有继续依赖这条媒体记录。",
  },
  confirmDeleteLabel: { en: "Delete record", zh: "删除记录" },
} as const;

export const adminMediaUsageTypeLabels = {
  all: { en: "All categories", zh: "全部分类" },
  hero: { en: "Hero", zh: "首屏" },
  project: { en: "Project", zh: "案例" },
  material: { en: "Material", zh: "材料" },
  blog: { en: "Blog", zh: "博客" },
  logo: { en: "Brand logo", zh: "品牌图标" },
  icon: { en: "Site icon", zh: "网站图标" },
  og: { en: "Share preview image", zh: "分享预览图" },
  before_after: { en: "Before and after", zh: "改造前后" },
  video: { en: "Video", zh: "视频" },
  general: { en: "General", zh: "通用" },
} as const;

export const adminMediaPerformanceText = {
  en: {
    missingPoster: {
      label: "Poster missing",
      detail: "This video has no poster, so the client may wait for video frames immediately.",
    },
    videoTooLarge: {
      label: "Video too large",
      detail: "Generate a lightweight MP4/WebM version for the frontend.",
    },
    videoLarge: {
      label: "Video is large",
      detail: "It can be uploaded, but the frontend must prioritize the poster and lazy loading.",
    },
    videoOk: {
      label: "Video manageable",
      detail: "A poster is available, so it can work well with lazy loading.",
    },
    missingRecord: {
      label: "Record incomplete",
      detail: "Size or dimensions are missing, so the admin panel cannot judge whether this image slows down the client.",
    },
    formatNeedsOptimization: {
      label: "Format needs optimization",
      detail: "Upload through the admin panel so the system can generate a WebP display version.",
    },
    imageTooLarge: {
      label: "Image too large",
      detail: "The frontend should not use this file directly.",
    },
    imageLarge: {
      label: "Image is large",
      detail: "It can be used, but lists and mobile pages must load a smaller display version.",
    },
    optimized: {
      label: "Optimized",
      detail: "Size and dimensions are suitable for SmartImage responsive loading.",
    },
    unknownType: {
      label: "Unknown type",
      detail: "Upload again through the media library so the backend can complete the file information.",
    },
  },
  zh: {
    missingPoster: {
      label: "缺少封面",
      detail: "视频没有 poster，客户端容易一上来就等视频画面。",
    },
    videoTooLarge: {
      label: "视频过大",
      detail: "建议给前台单独生成轻量 MP4/WebM 版本。",
    },
    videoLarge: {
      label: "视频偏大",
      detail: "可以上传，但前台必须 poster 优先、延迟加载。",
    },
    videoOk: {
      label: "视频可控",
      detail: "有封面，适合配合延迟加载使用。",
    },
    missingRecord: {
      label: "缺少记录",
      detail: "缺少尺寸或大小，后台无法判断这张图是否拖慢客户端。",
    },
    formatNeedsOptimization: {
      label: "格式待优化",
      detail: "建议走后台上传，让系统生成 WebP 展示版。",
    },
    imageTooLarge: {
      label: "图片过大",
      detail: "前台不应该直接使用这个文件。",
    },
    imageLarge: {
      label: "图片偏大",
      detail: "可以用，但列表和移动端必须加载较小展示版本。",
    },
    optimized: {
      label: "已优化",
      detail: "尺寸和体积适合通过 SmartImage 响应式加载。",
    },
    unknownType: {
      label: "未知类型",
      detail: "建议重新通过媒体库上传，让后台补齐文件信息。",
    },
  },
} as const;
