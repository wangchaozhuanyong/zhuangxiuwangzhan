import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminMediaAsset,
  deleteAdminMediaAsset,
  loadAdminMediaAssets,
  updateAdminMediaAsset,
} from "@/backend/modules/media/service/mediaService";
import type { AdminUploadedMedia } from "@/lib/adminMedia";
import {
  ADMIN_LIST_STALE_TIME,
  ADMIN_QUERY_GC_TIME,
  adminQueriesEnabled,
  clampPage,
  clampPageSize,
  normalizeAdminSearch,
  type AdminListQuery,
} from "@/lib/adminQueryCore";

export type AdminMediaAsset = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
  original_file_path?: string | null;
  original_mime_type?: string | null;
  original_size_bytes?: number | null;
  original_width?: number | null;
  original_height?: number | null;
  processing_status?: string | null;
  usage_type: string | null;
  folder: string | null;
  alt_zh: string | null;
  alt_en: string | null;
  created_at: string | null;
};

export function useAdminMediaAssets(options: Omit<AdminListQuery, "status"> & { usageType?: string } = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const usageType = options.usageType || "all";
  return useQuery({
    queryKey: ["admin", "media_assets", { page, pageSize, usageType, search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () => loadAdminMediaAssets<AdminMediaAsset>({ page, pageSize, usageType, search }),
  });
}

export function useCreateAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      url,
      upload,
      usageType = "general",
      folder = "media",
    }: {
      url: string;
      upload?: AdminUploadedMedia;
      usageType?: string;
      folder?: string;
    }) => {
      return createAdminMediaAsset({ url, upload, usageType, folder });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}

export function useUpdateAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Pick<AdminMediaAsset, "id" | "alt_zh" | "alt_en" | "usage_type" | "folder">) => {
      return updateAdminMediaAsset(asset);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}

export function useDeleteAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminMediaAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}
