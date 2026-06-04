import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { loadAdminBlogPostDetail, loadAdminBlogPostList, loadAdminBlogPostRows } from "@/backend/modules/blog/service/blogService";
import { loadAdminMaterialDetail, loadAdminMaterialList, loadAdminMaterialRows } from "@/backend/modules/materials/service/materialService";
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

const loadAdminBusinessRecord = async (table: AdminContentTable, id: string): Promise<Record<string, any>> => {
  switch (table) {
    case "services":
      return (await loadAdminServiceDetail(id)) as Record<string, any>;
    case "projects":
      return (await loadAdminProjectDetail(id)) as Record<string, any>;
    case "materials":
      return (await loadAdminMaterialDetail(id)) as Record<string, any>;
    case "blog_posts":
      return (await loadAdminBlogPostDetail(id)) as Record<string, any>;
  }
};

const loadAdminBusinessRows = async (table: AdminContentTable, limit: number): Promise<Record<string, any>[]> => {
  switch (table) {
    case "services":
      return (await loadAdminServiceRows(limit)) as Record<string, any>[];
    case "projects":
      return (await loadAdminProjectRows(limit)) as Record<string, any>[];
    case "materials":
      return (await loadAdminMaterialRows(limit)) as Record<string, any>[];
    case "blog_posts":
      return (await loadAdminBlogPostRows(limit)) as Record<string, any>[];
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
    queryFn: () =>
      loadAdminServiceList<AdminServiceRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }),
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
    queryFn: () =>
      loadAdminProjectList<AdminProjectRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }),
  });
}

export function useAdminMaterials(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "materials", { page, pageSize, status: options.status || "all", search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      loadAdminMaterialList<AdminMaterialRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }),
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
    queryFn: () =>
      loadAdminBlogPostList<AdminBlogRow>({
        page,
        pageSize,
        status: options.status,
        search,
      }),
  });
}

export function useAdminServiceDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "services", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: () => loadAdminServiceDetail(id!),
  });
}

export function useAdminProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "projects", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: () => loadAdminProjectDetail(id!),
  });
}

export function useAdminMaterialDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "materials", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: () => loadAdminMaterialDetail(id!),
  });
}

export function useAdminBlogPostDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "blog_posts", "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: () => loadAdminBlogPostDetail(id!),
  });
}

export function useAdminBusinessRecord(table: AdminContentTable, id: string | undefined) {
  return useQuery({
    queryKey: ["admin", table, "detail", id],
    enabled: adminQueriesEnabled && Boolean(id),
    queryFn: () => loadAdminBusinessRecord(table, id!),
  });
}

export function useAdminTableRows(table: AdminContentTable, limit = 200) {
  return useQuery({
    queryKey: ["admin", table, "rows", { limit }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () => loadAdminBusinessRows(table, limit),
  });
}

export function useAdminProjectImages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "project_images", projectId],
    enabled: adminQueriesEnabled && Boolean(projectId),
    queryFn: () => loadAdminProjectImages(projectId!),
  });
}
