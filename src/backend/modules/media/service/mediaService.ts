import { buildMediaAssetInsert, type AdminUploadedMedia } from "./mediaAssetMetadata";
import {
  createMediaAssetRecord,
  deleteMediaAssetRecord,
  downloadMediaStorageWebp,
  fetchAdminMediaAssetList,
  fetchMediaAssetCreatorId,
  getMediaStoragePublicUrl,
  hasMediaStorageClient,
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
