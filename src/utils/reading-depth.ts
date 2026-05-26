import { readingTime } from './reading-time';
import type { Post } from './posts';

export function readingDepthLayers(minutes: number): number {
  return Math.min(5, Math.max(1, Math.ceil(minutes / 5)));
}

export function postReadingMinutes(post: Post): number {
  return readingTime(post.body ?? post.data.description).minutes;
}

export function postReadingDepthLayers(post: Post): number {
  return readingDepthLayers(postReadingMinutes(post));
}
