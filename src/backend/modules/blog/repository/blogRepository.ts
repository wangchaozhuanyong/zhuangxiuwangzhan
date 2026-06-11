import type { QueryClient } from "@tanstack/react-query";
import { saveAdminRecord } from "@/lib/adminMutation";
import type { Database } from "@/lib/database.types";
import { requireSupabase } from "@/lib/supabase";

type BlogPostStatus = NonNullable<Database["public"]["Tables"]["blog_posts"]["Row"]["status"]>;
type SearchableQuery = {
  or(filters: string): unknown;
};

export type SaveBlogPostRecordInput = {
  payload: Record<string, unknown>;
  id?: string | null;
  expectedUpdatedAt?: string | null;
  action: "insert" | "update" | "publish";
  queryClient?: QueryClient;
};

export type AdminBlogListInput = {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
};

const applySearch = <TQuery extends SearchableQuery>(query: TQuery, fields: string[], search?: string): TQuery => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(",")) as TQuery;
};

export async function findBlogPostIdsBySlug(slug: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
  if (error) throw error;

  return (data || []).map((row) => String(row.id));
}

export async function fetchAdminBlogPostList<T extends Record<string, unknown>>(input: AdminBlogListInput) {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("blog_posts")
    .select("id,title_zh,title_en,slug,status,sort_order,category,published_at,cover_image_url,updated_at,created_at", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as BlogPostStatus);
  query = applySearch(query, ["title_zh", "title_en", "slug", "category"], input.search);
  query = query
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as T[], count: count ?? (data?.length || 0), page: input.page, pageSize: input.pageSize };
}

export async function fetchAdminBlogPostDetail(blogPostId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", blogPostId).single();
  if (error) throw error;
  return data;
}

export async function fetchAdminBlogPostRows(limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function saveBlogPostRecord(input: SaveBlogPostRecordInput) {
  return saveAdminRecord({
    table: "blog_posts",
    payload: input.payload,
    id: input.id,
    expectedUpdatedAt: input.expectedUpdatedAt,
    action: input.action,
    queryClient: input.queryClient,
  });
}

export async function invokeBlogPostEnglishGeneration(blogPostId: string, force: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke("generate-english-content", {
    body: { table: "blog_posts", id: blogPostId, force },
  });

  if (error) throw error;
  return true;
}
