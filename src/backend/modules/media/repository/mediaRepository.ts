import { buildMediaAssetInsert, type AdminUploadedMedia } from "@/lib/adminMedia";
import { supabase } from "@/lib/supabase";

export type CreateMediaAssetRecordInput = {
  url: string;
  upload?: AdminUploadedMedia;
  usageType?: string;
  folder?: string;
};

export type AdminMediaAssetListInput = {
  page: number;
  pageSize: number;
  usageType?: string;
  search?: string;
};

export type UpdateMediaAssetRecordInput = {
  id: string;
  alt_zh: string | null;
  alt_en: string | null;
  usage_type: string | null;
  folder: string | null;
};

export type MediaStorageUploadOptions = {
  cacheControl?: string;
  upsert?: boolean;
  contentType?: string;
};

type SearchableQuery = {
  or(filters: string): unknown;
};

export const hasMediaStorageClient = () => Boolean(supabase);

const applyMediaSearch = <TQuery extends SearchableQuery>(query: TQuery, search?: string): TQuery => {
  if (!search) return query;
  const escaped = search.replace(/[%_]/g, "\\$&");
  return query.or(
    [
      `file_name.ilike.%${escaped}%`,
      `folder.ilike.%${escaped}%`,
      `usage_type.ilike.%${escaped}%`,
      `mime_type.ilike.%${escaped}%`,
      `alt_zh.ilike.%${escaped}%`,
      `alt_en.ilike.%${escaped}%`,
    ].join(","),
  ) as TQuery;
};

export async function fetchAdminMediaAssetList<T>({
  page,
  pageSize,
  usageType = "all",
  search,
}: AdminMediaAssetListInput) {
  if (!supabase) throw new Error("Supabase is not configured.");

  let query = supabase
    .from("media_assets")
    .select(
      "id,file_url,file_path,file_name,mime_type,size_bytes,width,height,poster_url,duration_seconds,original_file_path,original_mime_type,original_size_bytes,original_width,original_height,processing_status,usage_type,folder,alt_zh,alt_en,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (usageType !== "all") query = query.eq("usage_type", usageType);
  query = applyMediaSearch(query, search);

  const from = page * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as T[],
    count: count ?? (data?.length || 0),
    page,
    pageSize,
  };
}

export async function createMediaAssetRecord({
  url,
  upload,
  usageType = "general",
  folder = "media",
}: CreateMediaAssetRecordInput) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("media_assets").insert({
    ...buildMediaAssetInsert({
      url,
      upload,
      usageType,
      folder,
      createdBy: userData.user?.id || null,
    }),
  });

  if (error) throw error;
  return true;
}

export async function updateMediaAssetRecord(asset: UpdateMediaAssetRecordInput) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("media_assets")
    .update({
      alt_zh: asset.alt_zh || null,
      alt_en: asset.alt_en || null,
      usage_type: asset.usage_type || null,
      folder: asset.folder || null,
    })
    .eq("id", asset.id);

  if (error) throw error;
  return true;
}

export async function deleteMediaAssetRecord(id: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function uploadMediaStorageObject(
  bucket: string,
  objectPath: string,
  file: File,
  options: MediaStorageUploadOptions,
) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.storage.from(bucket).upload(objectPath, file, options);
  if (error) throw error;
  return true;
}

export async function tryUploadMediaStorageObject(
  bucket: string,
  objectPath: string,
  file: File,
  options: MediaStorageUploadOptions,
) {
  try {
    await uploadMediaStorageObject(bucket, objectPath, file, options);
    return true;
  } catch {
    return false;
  }
}

export function getMediaStoragePublicUrl(bucket: string, objectPath: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
