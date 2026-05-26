import { describe, expect, test } from 'bun:test';
import {
  escapeHtml,
  formatBreadcrumb,
  sanitizeSearchExcerpt,
  stripBasePath,
  tagHue,
} from './browser-strings';

describe('browser string helpers', () => {
  test('escapeHtml escapes text and attributes', () => {
    expect(escapeHtml(`Tom & "Jerry" <script>'`)).toBe(
      'Tom &amp; &quot;Jerry&quot; &lt;script&gt;&#39;',
    );
  });

  test('sanitizeSearchExcerpt keeps only Pagefind mark tags', () => {
    expect(sanitizeSearchExcerpt('<mark>match</mark><img src=x>')).toBe(
      '<mark>match</mark>&lt;img src=x&gt;',
    );
  });

  test('formatBreadcrumb turns paths into compact crumbs', () => {
    expect(formatBreadcrumb('/de/posts/test/', 'https://costeer.dev')).toBe('de › posts › test');
    expect(formatBreadcrumb('/', 'https://costeer.dev')).toBe('/');
  });

  test('stripBasePath removes the configured leading base only', () => {
    expect(stripBasePath('/blog/de/posts', '/blog/')).toBe('/de/posts');
    expect(stripBasePath('/blog', '/blog/')).toBe('/');
    expect(stripBasePath('/other', '/blog/')).toBe('/other');
  });

  test('tagHue is deterministic and bounded', () => {
    expect(tagHue('astro')).toBe(tagHue('astro'));
    expect(tagHue('astro')).toBeGreaterThanOrEqual(0);
    expect(tagHue('astro')).toBeLessThan(360);
  });
});
