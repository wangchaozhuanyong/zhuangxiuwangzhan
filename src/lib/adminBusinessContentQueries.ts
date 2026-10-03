import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { keepPreviousData } from "@tanstack/react-query";
import { loadAdminBlogPostDetail, loadAdminBlogPostList, loadAdminBlogPostRows } from "@/backend/modules/blog/service/blogService";
import { loadAdminMaterialDetail, loadAdminMaterialImages, loadAdminMaterialList, loadAdminMaterialRows } from "@/backend/modules/materials/service/materialService";
import { loadAdminProjectDetail, loadAdminProjectImages, loadAdminProjectList, loadAdminProjectRows } from "@/backend/modules/projects/service/projectService";
import { loadAdminServiceDetail, loadAdminServiceList, loadAdminServiceRows } from "@/backend/modules/services/service/serviceService";
import {
  ADMIN_LIST_STALE_TIME,
  ADMIN_QUERY_GC_TIME,
  adminQueriesEnabled,
  clampPage,
  clampPageSize,
  normalizeAdminSearch,
  type AdminListQuery,
} from "@/lib/adminQueryCore";

export type AdminServiceRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type AdminProjectImageRow = {
  image_url: string;
  image_type: "gallery" | "before" | "after" | "cover";
  sort_order: number;
  alt_zh?: string | null;
  alt_en?: string | null;
};

export type AdminProjectRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  location?: string | null;
  project_type?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  project_images?: AdminProjectImageRow[] | null;
};

export type AdminMaterialRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  category?: string | null;
  subcategory?: string | null;
  material_type?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type AdminBlogRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  category?: string | null;
  published_at?: string | null;
  cover_image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type AdminContentTable = "services" | "projects" | "materials" | "blog_posts";
export type AdminBusinessRecord = Record<string, unknown>;

const loadAdminBusinessRecord = async (table: AdminContentTable, id: string, signal?: AbortSignal): Promise<AdminBusinessRecord> => {
  switch (table) {
    case "services":
      return (await loadAdminServiceDetail(id, signal)) as AdminBusinessRecord;
    case "projects":
      return (await loadAdminProjectDetail(id, signal)) as AdminBusinessRecord;
    case "materials":
      return (await loadAdminMaterialDetail(id, signal)) as AdminBusinessRecord;
    case "blog_posts":
      return (await loadAdminBlogPostDetail(id, signal)) as AdminBusinessRecord;
  }
};

const loadAdminBusinessRows = async (table: AdminContentTable, limit: number, signal?: AbortSignal): Promise<AdminBusinessRecord[]> => {
  switch (table) {
    case "services":
      return (await loadAdminServiceRows(limit, signal)) as AdminBusinessRecord[];
    case "projects":
      return (await loadAdminProjectRows(limit, signal)) as AdminBusinessRecord[];
    case "materials":
      return (await loadAdminMaterialRows(limit, signal)) as AdminBusinessRecord[];
    case "blog_posts":
      return (await loadAdminBlogPostRows(limit, signal)) as AdminBusinessRecord[];
  }
};

export function useAdminServices(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "services", { page, pageSize, status: options.status || "all", search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) =>
      loadAdminServiceList<AdminServiceRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }, signal),
  });
}

export function useAdminProjects(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "projects", { page, pageSize, status: options.status || "all", search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) =>
      loadAdminProjectList<AdminProjectRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }, signal),
  });
}

export function useAdminMaterials(options: AdminListQuery & { category?: string } = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "materials", { page, pageSize, status: options.status || "all", search, category: options.category || "all" }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) =>
      loadAdminMaterialList<AdminMaterialRow>({
        page,
        pageSize,
        status: options.status,
        search,
        category: options.category,
      }, signal),
  });
}

export function useAdminBlogPosts(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "blog_posts", { page, pageSize, status: options.status || "all", search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) =>
      loadAdminBlogPostList<AdminBlogRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }, signal),
  });
}

export function useAdminServiceDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "services", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: ({ signal }) => loadAdminServiceDetail(id!, signal),
  });
}

export function useAdminProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "projects", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: ({ signal }) => loadAdminProjectDetail(id!, signal),
  });
}

export function useAdminMaterialDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "materials", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: ({ signal }) => loadAdminMaterialDetail(id!, signal),
  });
}

export function useAdminBlogPostDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "blog_posts", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: ({ signal }) => loadAdminBlogPostDetail(id!, signal),
  });
}

export function useAdminBusinessRecord(table: AdminContentTable, id: string | undefined) {
  return useQuery({
    queryKey: ["admin", table, "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: ({ signal }) => loadAdminBusinessRecord(table, id!, signal),
  });
}

export function useAdminTableRows(table: AdminContentTable, limit = 200) {
  return useQuery({
    queryKey: ["admin", table, "rows", { limit }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) => loadAdminBusinessRows(table, limit, signal),
  });
}

export function useAdminProjectImages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "project_images", projectId],
    enabled: adminQueriesEnabled && Boolean(projectId),
    queryFn: ({ signal }) => loadAdminProjectImages(projectId!, signal),
  });
}

export function useAdminMaterialImages(materialId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "material_images", materialId],
    enabled: adminQueriesEnabled && Boolean(materialId),
    queryFn: ({ signal }) => loadAdminMaterialImages(materialId!, signal),
  });
}
