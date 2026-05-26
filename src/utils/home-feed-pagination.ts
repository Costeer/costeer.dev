import { SITE } from '../config';

export function homeFeedPageCount(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / SITE.postsPerPage));
}

export function homeFeedPage<T>(posts: T[], page: number): T[] {
  const start = Math.max(0, page - 1) * SITE.postsPerPage;
  return posts.slice(start, start + SITE.postsPerPage);
}
