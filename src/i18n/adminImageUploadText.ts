export const adminImageUploadText = {
  previewAlt: { en: "Uploaded preview", zh: "已上传预览" },
  upload: { en: "Upload", zh: "上传" },
  uploading: { en: "Uploading...", zh: "上传中..." },
  bucketTip: { en: "Public display bucket:", zh: "前台展示桶：" },
  automationTip: {
    en: "Automatically keeps image metadata and generates a WebP display file for the client.",
    zh: "上传后会自动记录尺寸、大小和格式，并生成前台用的 WebP 展示图。",
  },
  optimized: { en: "Optimized display image is ready.", zh: "前台展示图已自动处理完成。" },
  originalSaved: {
    en: "Original file was kept in the private originals bucket.",
    zh: "原始文件已保存在私有原图桶。",
  },
  originalSkipped: {
    en: "Original bucket is not ready yet; the public optimized image was still uploaded.",
    zh: "原图桶暂未准备好，本次已先上传前台优化图。",
  },
  uploadFailed: { en: "Upload failed. Please try again later.", zh: "上传失败，请稍后再试。" },
  mediaRecordFailed: { en: "Media library record creation failed.", zh: "媒体库记录创建失败。" },
  mediaRecordFailedWithReason: {
    en: "Media library record creation failed: {reason}",
    zh: "媒体库记录创建失败：{reason}",
  },
} as const;
