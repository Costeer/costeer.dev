import { describe, expect, test } from 'bun:test';
import { alternates, localizedPath, stripLocale } from '../i18n/utils';
import { homeFeedPage, homeFeedPageCount } from './home-feed-pagination';
import { postSlugFromId, slugify } from './post-routing';
import { readingDepthLayers } from './reading-depth';
import { readingTime } from './reading-time';
import { styleGradientForPost } from './style-tags';
import type { Post } from './posts';

const post = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 'en/example-post.md',
    body: 'one two three four five',
    data: {
      title: 'Example',
      description: 'Fallback words',
      lang: 'en',
      translationKey: 'example-post',
      tags: ['technical'],
      categories: ['Notes'],
      pubDate: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...overrides,
  }) as Post;

describe('pure helpers', () => {
  test('slugify normalizes labels for URLs', () => {
    expect(slugify('Über Cool / Astro')).toBe('uber-cool-astro');
  });

  test('postSlug strips locale and markdown extension', () => {
    expect(postSlugFromId('de/nested/beitrag.mdx', ['en', 'de'])).toBe('nested/beitrag');
  });

  test('localizedPath and stripLocale round-trip locale prefixes', () => {
    expect(localizedPath('/posts/foo/', 'en')).toBe('/posts/foo/');
    expect(localizedPath('/posts/foo/', 'de')).toBe('/de/posts/foo/');
    expect(stripLocale('/de/posts/foo/')).toBe('/posts/foo/');
  });

  test('alternates includes configured locales and x-default', () => {
    expect(alternates('/posts/foo/').map((item) => item.locale)).toEqual(['en', 'de', 'x-default']);
  });

  test('readingTime strips code and html', () => {
    expect(readingTime('one two <b>three</b> ```ignored code``` four').words).toBe(4);
  });

  test('readingDepthLayers clamps to one through five', () => {
    expect(readingDepthLayers(1)).toBe(1);
    expect(readingDepthLayers(13)).toBe(3);
    expect(readingDepthLayers(100)).toBe(5);
  });

  test('styleGradientForPost is stable for styled posts', () => {
    expect(styleGradientForPost(post())).toEqual(styleGradientForPost(post()));
  });

  test('home feed pagination returns page counts and slices', () => {
    const posts = Array.from({ length: 14 }, (_, index) => post({ id: `en/${index}.md` }));
    expect(homeFeedPageCount(posts.length)).toBe(3);
    expect(homeFeedPage(posts, 2).map((item) => item.id)).toEqual([
      'en/6.md',
      'en/7.md',
      'en/8.md',
      'en/9.md',
      'en/10.md',
      'en/11.md',
    ]);
  });
});
