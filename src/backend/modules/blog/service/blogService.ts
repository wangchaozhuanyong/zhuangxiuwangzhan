import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAdminBlogPostDetail,
  fetchAdminBlogPostList,
  fetchAdminBlogPostRows,
  findBlogPostIdsBySlug,
  invokeBlogPostEnglishGeneration,
  saveBlogPostRecord,
  type AdminBlogListInput,
} from "@/backend/modules/blog/repository/blogRepository";

type AdminBlogPostRecord = Record<string, any> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
};

export type SaveAdminBlogPostInput = {
  record: AdminBlogPostRecord;
  nextStatus?: AdminBlogPostRecord["status"];
  queryClient?: QueryClient;
};

export const hasBlogBackendConfig = () => isSupabaseConfigured;

export const normalizeBlogSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function checkAdminBlogSlugUnique(slug: string, currentId?: string) {
  const value = normalizeBlogSlug(slug);
  if (!value) return false;

  const ids = await findBlogPostIdsBySlug(value);
  return !ids.some((id) => id !== currentId);
}

export function buildAdminBlogPostPayload(record: AdminBlogPostRecord, nextStatus?: AdminBlogPostRecord["status"]) {
  const slug = normalizeBlogSlug(record.slug || record.title_zh || "");

  return {
    slug,
    payload: {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      sort_order: Number(record.sort_order || 0),
      tags: record.tags || [],
      published_at: nextStatus === "published" ? record.published_at || new Date().toISOString() : record.published_at || null,
    },
  };
}

export async function saveAdminBlogPost(input: SaveAdminBlogPostInput) {
  const { slug, payload } = buildAdminBlogPostPayload(input.record, input.nextStatus);
  const saved = await saveBlogPostRecord({
    payload,
    id: input.record.id,
    expectedUpdatedAt: input.record.updated_at || null,
    action: input.nextStatus === "published" ? "publish" : input.record.id ? "update" : "insert",
    queryClient: input.queryClient,
  });

  return {
    saved,
    savedId: String((saved as Record<string, unknown>)?.id || ""),
    slug,
    status: payload.status,
  };
}

export function generateAdminBlogEnglish(blogPostId: string, force: boolean) {
  return invokeBlogPostEnglishGeneration(blogPostId, force);
}

export function loadAdminBlogPostList<T extends Record<string, any>>(input: AdminBlogListInput) {
  return fetchAdminBlogPostList<T>(input);
}

export function loadAdminBlogPostDetail(blogPostId: string) {
  return fetchAdminBlogPostDetail(blogPostId);
}

export function loadAdminBlogPostRows(limit: number) {
  return fetchAdminBlogPostRows(limit);
}
