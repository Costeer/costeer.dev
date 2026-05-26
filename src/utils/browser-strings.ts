/* global URL */

export function escapeHtml(value: string | number | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const escapeAttr = escapeHtml;

export function sanitizeSearchExcerpt(html: string | undefined): string {
  const escaped = escapeHtml(html ?? '');
  return escaped.replaceAll('&lt;mark&gt;', '<mark>').replaceAll('&lt;/mark&gt;', '</mark>');
}

export function formatBreadcrumb(url: string, origin = 'https://example.test'): string {
  try {
    const parsed = new URL(url, origin);
    const parts = parsed.pathname.replace(/\/+$/g, '').split('/').filter(Boolean);
    return parts.length === 0 ? '/' : parts.join(' › ');
  } catch {
    return url;
  }
}

export function stripBasePath(pathname: string, base: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  if (!normalizedBase) return pathname;
  if (pathname === normalizedBase) return '/';
  if (pathname.startsWith(`${normalizedBase}/`)) return pathname.slice(normalizedBase.length);
  return pathname;
}

export function tagHue(tag: string): number {
  return [...tag].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 0);
}
