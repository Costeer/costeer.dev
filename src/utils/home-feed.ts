import type { Locale } from '../config';
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { formatDate, isoDate } from '../i18n/utils';
import { type Post, heroImage, heroImageSrc, postPath, shouldShowHero } from './posts';
import { postReadingDepthLayers, postReadingMinutes } from './reading-depth';
import { getPostStyle, normalizeStyleTag, orderedTags, styleProperties } from './style-tags';
import { escapeAttr, escapeHtml, tagHue } from './browser-strings';
export { homeFeedPage, homeFeedPageCount } from './home-feed-pagination';

export type HomeFeedPost = {
  href: string;
  title: string;
  description: string;
  dateIso: string;
  dateLabel: string;
  categories: string[];
  tags: string[];
  displayTags: string[];
  pinned: boolean;
  lang: Locale;
  isForeignLanguage: boolean;
  readingMinutes: number;
  readingDepthLayers: number;
  styleClassName: string;
  styleTag: string | undefined;
  styleProperties: string;
  styleSlug: string | undefined;
  hero:
    | {
        src: string;
        alt: string;
        srcset: string | undefined;
        sizes: string | undefined;
        width: number | undefined;
        height: number | undefined;
        format: string | undefined;
      }
    | undefined;
};

export const homeFeedCardImageWidths = [360, 540, 720, 960];
export const homeFeedCardImageSizes =
  '(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(100vw - 3rem), (max-width: 1279px) calc((100vw - 22.25rem) * 0.416), (max-width: 1439px) 270px, (max-width: 1649px) 330px, 396px';

const icon = (name: 'clock' | 'folder' | 'pin', size = 12) => {
  const paths = {
    clock: ['M12 6v6l4 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
    folder: [
      'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
    ],
    pin: ['M12 17v5', 'M5 17h14', 'M7 17l1-10h8l1 10', 'M9 7V2h6v5'],
  };

  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[
    name
  ]
    .map((d) => `<path d="${d}"></path>`)
    .join('')}</svg>`;
};

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src) || src.startsWith('//');

async function serializeHomeFeedHero(post: Post): Promise<HomeFeedPost['hero']> {
  if (!shouldShowHero(post)) return undefined;

  const heroAsset = heroImage(post);
  const heroSrc = heroImageSrc(post);
  if (!heroAsset || !heroSrc) return undefined;

  if (typeof heroAsset === 'string' && !isRemoteImage(heroAsset)) {
    return {
      src: heroSrc,
      alt: post.data.heroImageAlt ?? '',
      srcset: undefined,
      sizes: undefined,
      width: undefined,
      height: undefined,
      format: undefined,
    };
  }

  const image = await getImage({
    src: heroAsset as string | ImageMetadata,
    widths: homeFeedCardImageWidths,
    sizes: homeFeedCardImageSizes,
    width: typeof heroAsset === 'string' ? 960 : undefined,
    height: typeof heroAsset === 'string' ? 540 : undefined,
    layout: 'constrained',
    format: 'webp',
    quality: 70,
  });

  return {
    src: image.src,
    alt: post.data.heroImageAlt ?? '',
    srcset: image.srcSet.values.length > 0 ? image.srcSet.attribute : undefined,
    sizes: image.attributes.sizes ?? homeFeedCardImageSizes,
    width: Number(image.attributes.width) || undefined,
    height: Number(image.attributes.height) || undefined,
    format: image.options.format,
  };
}

export async function serializeHomeFeedPost(post: Post, locale: Locale): Promise<HomeFeedPost> {
  const postStyle = getPostStyle(post);
  const hero = await serializeHomeFeedHero(post);

  return {
    href: postPath(post),
    title: post.data.title,
    description: post.data.description,
    dateIso: isoDate(post.data.pubDate),
    dateLabel: formatDate(post.data.pubDate, locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    categories: post.data.categories,
    tags: post.data.tags,
    displayTags: orderedTags(post),
    pinned: Boolean(post.data.pinned),
    lang: post.data.lang,
    isForeignLanguage: post.data.lang !== locale,
    readingMinutes: postReadingMinutes(post),
    readingDepthLayers: postReadingDepthLayers(post),
    styleClassName: postStyle.className,
    styleTag: postStyle.tag,
    styleProperties: styleProperties(postStyle),
    styleSlug: postStyle.definition?.slug,
    hero,
  };
}

export function renderHomeFeedPostHtml(
  post: HomeFeedPost,
  index: number,
  labels: { pinned: string },
): string {
  const hasImage = Boolean(post.hero);
  const articleClass = [
    'chirpy-card',
    post.styleClassName,
    post.styleTag ? 'has-style-tag' : '',
    `reading-depth-${post.readingDepthLayers}`,
    'chirpy-card-lazy',
    'chirpy-card-float-in',
  ]
    .filter(Boolean)
    .join(' ');
  const articleStyle = `--chirpy-card-delay: ${Math.min(index * 80, 500)}ms; --reading-depth-layers: ${post.readingDepthLayers}; ${post.styleProperties}`;
  const imageAttrs = post.hero
    ? [
        `src="${escapeAttr(post.hero.src)}"`,
        `alt="${escapeAttr(post.hero.alt)}"`,
        post.hero.srcset ? `srcset="${escapeAttr(post.hero.srcset)}"` : '',
        post.hero.sizes ? `sizes="${escapeAttr(post.hero.sizes)}"` : '',
        post.hero.width ? `width="${post.hero.width}"` : '',
        post.hero.height ? `height="${post.hero.height}"` : '',
        'class="chirpy-card-image"',
        'loading="lazy"',
        'decoding="async"',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const categories =
    post.categories.length > 0
      ? `<span class="inline-flex items-center gap-1">${icon('folder')}<span>${escapeHtml(
          post.categories.join(', '),
        )}</span></span>`
      : '';

  const tags =
    post.displayTags.length > 0
      ? `<span class="inline-flex flex-wrap items-center gap-1.5">${post.displayTags
          .slice(0, 4)
          .map((tag) => {
            const isStyle = post.styleSlug === normalizeStyleTag(tag);
            const style = isStyle ? '' : ` style="--tag-hue: ${tagHue(tag)}"`;
            return `<span class="post-tag${isStyle ? ' post-tag--style' : ''}"${style}>${escapeHtml(
              tag,
            )}</span>`;
          })
          .join('')}</span>`
      : '';

  const languageMarker = post.isForeignLanguage
    ? '<span class="language-marker language-marker--card language-marker--label">EN</span>'
    : '';

  const pinned = post.pinned
    ? `<span class="text-primary inline-flex items-center gap-1" title="${escapeAttr(
        labels.pinned,
      )}" aria-label="${escapeAttr(labels.pinned)}">${icon('pin', 14)}</span>`
    : '';

  return `<article class="${escapeAttr(articleClass)}" data-card-animate="true"${
    post.styleTag ? ` data-style-tag="${escapeAttr(post.styleTag)}"` : ''
  } data-reading-depth="${post.readingDepthLayers}" data-post-filter-item="true" data-post-date="${escapeAttr(
    post.dateIso,
  )}" data-post-tags="${escapeAttr(post.tags.join('|'))}" data-post-categories="${escapeAttr(
    post.categories.join('|'),
  )}" style="${escapeAttr(articleStyle)}"><span class="reading-depth-layer reading-depth-layer--1" aria-hidden="true"></span><span class="reading-depth-layer reading-depth-layer--2" aria-hidden="true"></span><span class="reading-depth-layer reading-depth-layer--3" aria-hidden="true"></span><span class="reading-depth-layer reading-depth-layer--4" aria-hidden="true"></span><a href="${escapeAttr(
    post.href,
  )}" class="chirpy-card-link ${hasImage ? 'has-image' : 'no-image'} fixed-size" data-post-card-link="true">${
    post.hero ? `<div class="chirpy-card-image-wrap"><img ${imageAttrs}></div>` : ''
  }<div class="chirpy-card-body ${hasImage ? '' : 'full'}"><div class="chirpy-card-title-row"><h2 class="chirpy-card-title ${
    hasImage ? '' : 'compact'
  }">${escapeHtml(post.title)}</h2>${languageMarker}</div><p class="text-base-content text-base ${
    hasImage ? 'mt-2 mb-3 line-clamp-2' : 'mt-1 mb-2 line-clamp-3'
  }">${escapeHtml(
    post.description,
  )}</p><div class="text-base-content mt-3 flex items-end justify-between gap-2 text-xs"><div class="flex flex-wrap items-center gap-x-3 gap-y-1"><span class="inline-flex items-center gap-1">${icon(
    'clock',
  )}<span class="sr-only">${post.readingMinutes} minute read, </span><time datetime="${escapeAttr(
    post.dateIso,
  )}">${escapeHtml(post.dateLabel)}</time></span>${categories}${tags}</div>${pinned}</div></div></a></article>`;
}
