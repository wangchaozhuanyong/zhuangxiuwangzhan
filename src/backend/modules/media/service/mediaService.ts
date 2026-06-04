import {
  createMediaAssetRecord,
  deleteMediaAssetRecord,
  fetchAdminMediaAssetList,
  getMediaStoragePublicUrl,
  hasMediaStorageClient,
  tryUploadMediaStorageObject,
  updateMediaAssetRecord,
  uploadMediaStorageObject,
  type AdminMediaAssetListInput,
  type CreateMediaAssetRecordInput,
  type MediaStorageUploadOptions,
  type UpdateMediaAssetRecordInput,
} from "@/backend/modules/media/repository/mediaRepository";

export { getMediaStoragePublicUrl, hasMediaStorageClient };

export function createAdminMediaAsset(input: CreateMediaAssetRecordInput) {
  return createMediaAssetRecord(input);
}

export function loadAdminMediaAssets<T>(input: AdminMediaAssetListInput) {
  return fetchAdminMediaAssetList<T>(input);
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
