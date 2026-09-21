import { apiFetch, ApiError } from '@/lib/api';

/** Pages et articles éditoriaux, branchés sur `GET /content/pages` et `/content/posts`. */

export type ContentBlock = { type: string; value?: string; [key: string]: unknown };

export type Page = {
  id: string;
  title: string;
  slug: string;
  content: { blocks: ContentBlock[] };
  coverUrl: string | null;
  publishedAt: string;
};

export async function getPage(slug: string): Promise<Page | null> {
  try {
    return await apiFetch<Page>(`/content/pages/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string;
};

export async function listPosts(): Promise<{ posts: PostSummary[]; total: number }> {
  const page = await apiFetch<{ items: PostSummary[]; meta: { total: number } }>('/content/posts?perPage=24');
  return { posts: page.items, total: page.meta.total };
}

export type Post = PostSummary & {
  content: { blocks: ContentBlock[] };
  tags: string[];
  authorName: string | null;
  seo: { title: string; description: string };
};

export async function getPost(slug: string): Promise<Post | null> {
  try {
    return await apiFetch<Post>(`/content/posts/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
