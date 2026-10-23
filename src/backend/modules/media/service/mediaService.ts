import { buildMediaAssetInsert, type AdminUploadedMedia } from "./mediaAssetMetadata";
import {
  createMediaAssetRecord,
  deleteMediaAssetRecord,
  downloadMediaStorageWebp,
  fetchAdminMediaAssetList,
  fetchMediaAssetCreatorId,
  getMediaStoragePublicUrl,
  hasMediaStorageClient,
  mediaStorageObjectExists,
  removeMediaStorageObject,
  tryUploadMediaStorageObject,
  updateMediaAssetRecord,
  uploadMediaStorageObject,
  type AdminMediaAssetListInput,
  type MediaStorageUploadOptions,
  type UpdateMediaAssetRecordInput,
} from "@/backend/modules/media/repository/mediaRepository";

export { getMediaStoragePublicUrl, hasMediaStorageClient };

export type CreateAdminMediaAssetInput = {
  url: string;
  upload?: AdminUploadedMedia;
  usageType?: string;
  folder?: string;
};

export async function createAdminMediaAsset(input: CreateAdminMediaAssetInput) {
  const createdBy = await fetchMediaAssetCreatorId();
  return createMediaAssetRecord(buildMediaAssetInsert({ ...input, createdBy }));
}

export function loadAdminMediaAssets<T>(input: AdminMediaAssetListInput, signal?: AbortSignal) {
  return fetchAdminMediaAssetList<T>(input, signal);
}

export function updateAdminMediaAsset(input: UpdateMediaAssetRecordInput) {
  return updateMediaAssetRecord(input);
}

export function deleteAdminMediaAsset(id: string) {
  return deleteMediaAssetRecord(id);
}

export function uploadAdminMediaObject(
  bucket: string,
  objectPath: string,
  file: File,
  options: MediaStorageUploadOptions,
) {
  return uploadMediaStorageObject(bucket, objectPath, file, options);
}

export class AdminVideoUploadStorageError extends Error {
  constructor(readonly reason: "failed" | "unconfirmed" | "cleanup_failed") {
    super("Video storage upload did not complete.");
  }
}

export async function uploadAdminVideoObjects(input: {
  posterPath: string;
  videoPath: string;
  poster: File;
  video: File;
}) {
  // Paths belong to this upload attempt and contain a fresh UUID. An error can
  // mean the response was lost after Storage committed the object.
  const uploadConfirmed = async (bucket: string, path: string, file: File) => {
    try {
      await uploadMediaStorageObject(bucket, path, file, {
        cacheControl: "31536000", upsert: false, contentType: file.type || undefined,
      });
      return true;
    } catch {
      try { return await mediaStorageObjectExists(bucket, path); }
      catch { throw new AdminVideoUploadStorageError("unconfirmed"); }
    }
  };
  if (!await uploadConfirmed("site-images", input.posterPath, input.poster)) {
    throw new AdminVideoUploadStorageError("failed");
  }
  if (!await uploadConfirmed("site-videos", input.videoPath, input.video)) {
    // Only compensate the poster confirmed created by this failed attempt.
    // Unknown video outcomes keep their poster until they can be confirmed.
    try { await removeMediaStorageObject("site-images", input.posterPath); }
    catch { throw new AdminVideoUploadStorageError("cleanup_failed"); }
    throw new AdminVideoUploadStorageError("failed");
  }
}

export function tryUploadAdminMediaObject(
  bucket: string,
  objectPath: string,
  file: File,
  options: MediaStorageUploadOptions,
) {
  return tryUploadMediaStorageObject(bucket, objectPath, file, options);
}

export function downloadAdminMediaWebp(
  bucket: string,
  objectPath: string,
  transform: { width: number; height: number; quality: number },
) {
  return downloadMediaStorageWebp(bucket, objectPath, transform);
}
