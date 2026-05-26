/** Strip locale prefix from a content ID. */
export function stripLocaleFromId(id: string, locales: readonly string[]): string {
  const segs = id.split(/[\\/]/);
  if (segs[0] && locales.includes(segs[0])) {
    return segs.slice(1).join('/');
  }
  return id;
}

/** Public slug used for the URL: filename minus locale and extension. */
export function postSlugFromId(id: string, locales: readonly string[]): string {
  return stripLocaleFromId(id, locales).replace(/\.(md|mdx)$/i, '');
}

/** Slugify a tag/category for use in URLs. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
