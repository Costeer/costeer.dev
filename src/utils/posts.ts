/**
 * Post helpers.
 *
 * Wraps the `astro:content` collection API to:
 *  - filter drafts in production
 *  - infer locale from filesystem path (posts/en/foo -> 'en')
 *  - sort by pubDate desc, with pinned posts first
 *  - group posts by tag / category / month
 *  - resolve translation siblings via `translationKey`
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

import { SITE, type Locale } from '../config';
import { withBase } from '../i18n/utils';
import { postSlugFromId, slugify, stripLocaleFromId } from './post-routing';

export type Post = CollectionEntry<'posts'> & {
  data: CollectionEntry<'posts'>['data'] & { lang: Locale; translationKey: string };
};

const isProd = import.meta.env.PROD;
const skipPostCollections = import.meta.env.CI_SKIP_CONTENT_COLLECTIONS === 'true';

/** Derive the locale from `posts/<locale>/foo` slug-ish ID. */
function localeFromId(id: string): Locale {
  const seg = id.split(/[\\/]/)[0];
  if (seg && (SITE.locales as readonly string[]).includes(seg)) return seg as Locale;
  return SITE.defaultLocale;
}

/** Normalize a post entry: ensure `lang` and `translationKey` are set. */
function normalize(entry: CollectionEntry<'posts'>): Post {
  const lang = entry.data.lang ?? localeFromId(entry.id);
  const translationKey = entry.data.translationKey ?? stripLocaleFromId(entry.id, SITE.locales);
  return {
    ...entry,
    data: { ...entry.data, lang, translationKey },
  } as Post;
}

/** Public slug used for the URL: filename minus locale and extension. */
export function postSlug(entry: Post): string {
  return postSlugFromId(entry.id, SITE.locales);
}

/** Full localized URL path for a post. */
export function postPath(entry: Post): string {
  const slug = postSlug(entry);
  const path =
    entry.data.lang === SITE.defaultLocale
      ? `/posts/${slug}/`
      : `/${entry.data.lang}/posts/${slug}/`;
  return withBase(path);
}

/** Sort posts: pinned first, then by pubDate desc. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    const at = a.data.pubDate?.valueOf?.() ?? 0;
    const bt = b.data.pubDate?.valueOf?.() ?? 0;
    return bt - at;
  });
}

/** Prefer the requested locale when multiple translations share a key. */
function dedupeByTranslationKey(posts: Post[], preferredLocale: Locale): Post[] {
  const deduped = new Map<string, Post>();

  for (const post of posts) {
    const existing = deduped.get(post.data.translationKey);
    if (!existing) {
      deduped.set(post.data.translationKey, post);
      continue;
    }

    if (existing.data.lang !== preferredLocale && post.data.lang === preferredLocale) {
      deduped.set(post.data.translationKey, post);
    }
  }

  return Array.from(deduped.values());
}

/**
 * Sort posts strictly by `pubDate` (newest first), ignoring `pinned`.
 *
 * Used for prev/next post navigation: pinned posts shouldn't yank the
 * latest entry to position 0 and break the chronological chain (which
 * would label a newer post as "Previous" of an older pinned post).
 */
export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const at = a.data.pubDate?.valueOf?.() ?? 0;
    const bt = b.data.pubDate?.valueOf?.() ?? 0;
    return bt - at;
  });
}

/** Get all posts for a locale (drafts hidden in prod, sorted). */
export async function getPosts(locale: Locale): Promise<Post[]> {
  if (skipPostCollections) return [];
  const all = await getCollection('posts', (entry) => {
    if (isProd && entry.data.draft) return false;
    const lang = (entry.data.lang ?? localeFromId(entry.id)) as Locale;
    return lang === locale;
  });
  return sortPosts(all.map(normalize));
}

/**
 * Posts visible in a locale's listings.
 *
 * The default English site stays English-only. Non-default locales also show
 * English posts so readers on the German site can still discover untranslated
 * writing, with the UI marking those posts by language.
 */
export async function getVisiblePosts(locale: Locale): Promise<Post[]> {
  if (locale === SITE.defaultLocale) return getPosts(locale);
  if (skipPostCollections) return [];
  const visibleLocales = new Set<Locale>([locale, SITE.defaultLocale]);
  const all = await getCollection('posts', (entry) => {
    if (isProd && entry.data.draft) return false;
    const lang = (entry.data.lang ?? localeFromId(entry.id)) as Locale;
    return visibleLocales.has(lang);
  });
  const normalized = all.map(normalize);

  // Only the German site should collapse translation pairs and prefer the
  // German version when both EN and DE exist. Other locales keep the
  // current "show all visible posts" behavior.
  if (locale === 'de') {
    return sortPosts(dedupeByTranslationKey(normalized, locale));
  }

  return sortPosts(normalized);
}

/** Find a single post by locale + slug (path-relative). */
export async function getPostBySlug(locale: Locale, slug: string): Promise<Post | undefined> {
  const posts = await getPosts(locale);
  return posts.find((p) => postSlug(p) === slug);
}

/** All translation siblings of a post (other locales sharing translationKey). */
export async function getTranslations(entry: Post): Promise<Record<Locale, Post | undefined>> {
  const out: Partial<Record<Locale, Post | undefined>> = {};
  for (const locale of SITE.locales) {
    if (locale === entry.data.lang) {
      out[locale] = entry;
      continue;
    }
    const all = await getPosts(locale);
    out[locale] = all.find((p) => p.data.translationKey === entry.data.translationKey);
  }
  return out as Record<Locale, Post | undefined>;
}

/** Tags for a locale, with counts, sorted by count desc then alpha. */
export async function getTagsWithCount(
  locale: Locale,
): Promise<Array<{ name: string; count: number }>> {
  const posts = await getVisiblePosts(locale);
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Categories for a locale, with counts. */
export async function getCategoriesWithCount(
  locale: Locale,
): Promise<Array<{ name: string; count: number }>> {
  const posts = await getVisiblePosts(locale);
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const c of p.data.categories) map.set(c, (map.get(c) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Resolve whether a post should display its featured (hero) image,
 * considering the per-post override (`showFeaturedImage`) and the
 * site-wide default (`SITE.showFeaturedImages`).
 *
 * Returns `false` when there is no `heroImage` to show.
 */
export function shouldShowHero(post: Post): boolean {
  if (!post.data.heroImage) return false;
  return post.data.showFeaturedImage ?? SITE.showFeaturedImages;
}

/** The hero image source URL/path for a post (or undefined). */
export function heroImageSrc(post: Post): string | undefined {
  const img = post.data.heroImage;
  if (!img) return undefined;
  let src: string | undefined;
  if (typeof img === 'string') src = img;
  // Imported asset (ImageMetadata): unwrap to its public URL.
  else if (typeof img === 'object' && 'src' in (img as Record<string, unknown>)) {
    src = (img as { src: string }).src;
  }
  if (!src) return undefined;
  // Prefix the configured base for absolute paths into /public.
  return src.startsWith('/') && !src.startsWith('//') ? withBase(src) : src;
}

/**
 * The raw hero image, suitable for passing straight to `<SmartImage>`.
 * Preserves the `ImageMetadata` shape (so the image pipeline can use
 * intrinsic dimensions) for assets imported via the `image()` schema,
 * and prefixes `withBase()` only on plain `/public/...` strings.
 */
export function heroImage(post: Post): ImageMetadata | string | undefined {
  const img = post.data.heroImage;
  if (!img) return undefined;
  if (typeof img === 'string') {
    return img.startsWith('/') && !img.startsWith('//') ? withBase(img) : img;
  }
  return img as ImageMetadata;
}

/** Demo/sample content that should not get production-only generated assets. */
export function isDemoPost(post: Post): boolean {
  const key = post.data.translationKey;
  return (
    key === 'getting-started' ||
    /^lorem-ipsum-\d+$/i.test(key) ||
    post.data.tags.some((tag) => tag === 'lorem' || tag === 'placeholder')
  );
}

export { slugify };

/** Build the URL for a tag listing page in a given locale. */
export function tagPath(locale: Locale, tag: string): string {
  const slug = slugify(tag);
  const path = locale === SITE.defaultLocale ? `/tags/${slug}/` : `/${locale}/tags/${slug}/`;
  return withBase(path);
}

/** Build the URL for a category listing page in a given locale. */
export function categoryPath(locale: Locale, category: string): string {
  const slug = slugify(category);
  const path =
    locale === SITE.defaultLocale ? `/categories/${slug}/` : `/${locale}/categories/${slug}/`;
  return withBase(path);
}
