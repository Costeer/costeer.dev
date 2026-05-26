import avatarImg from './assets/images/site/avatar.webp';
import ogDefaultImg from './assets/images/site/og-default.svg';
import type { SiteConfig, NavItem, SocialLink, MastodonCommentsConfig } from './types/config';

/**
 * Global site configuration.
 * Edit values here to update site identity. All values are typed and consumed
 * across layouts, components, RSS, sitemap, and SEO.
 */

// Export imported site images for use in components
export const SITE_IMAGES = {
  avatar: avatarImg,
  ogDefault: ogDefaultImg,
} as const;

export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

/**
 * Author + social handles. Filled in from env vars (see `.env.example`)
 * so identifiers never need to be hard-coded into source.
 *
 * Leave any handle as an empty string to drop it from the sidebar
 * automatically — the entry won't render and no broken `your-handle`
 * URL is exposed.
 */
const CODEBERG_HANDLE = import.meta.env.PUBLIC_CODEBERG_HANDLE ?? '';
const CODEBERG_REPO = import.meta.env.PUBLIC_CODEBERG_REPO ?? 'costeer.dev';
const MASTODON_PROFILE_URL = import.meta.env.PUBLIC_MASTODON_PROFILE_URL ?? '';
/**
 * Public Codeberg coordinates of the deployed source. Useful for custom links
 * and integrations that need a repository URL. When
 * `PUBLIC_CODEBERG_HANDLE` is unset, `url` falls back to a safe default so
 * generated links never point at a 404.
 */
export const REPO = {
  handle: CODEBERG_HANDLE,
  name: CODEBERG_REPO,
  url: CODEBERG_HANDLE
    ? `https://codeberg.org/${CODEBERG_HANDLE}/${CODEBERG_REPO}`
    : 'https://codeberg.org',
} as const;

export const SITE: SiteConfig = {
  title: 'costeer.dev',
  /** Site tagline / description. */
  description:
    'Personal publishing system for technical notes and political writing, light brutalist, accessible, and direct.',
  /** Author/handle shown in footer + meta. */
  author: {
    name: 'costeer',
    url: CODEBERG_HANDLE ? `https://codeberg.org/${CODEBERG_HANDLE}` : undefined,
    avatar: avatarImg,
    bio: 'Im a developer and activist from Germany',
  },
  /** Default OG image. */
  defaultOgImage: ogDefaultImg.src,
  /** Number of posts per page on listings. */
  postsPerPage: 6,
  /** Display ISO 8601 date format if true, otherwise locale-aware. */
  isoDates: false,
  /** Site-wide default for whether posts should display their featured image. */
  showFeaturedImages: true,
  /** Wrap the article body of posts and pages in a bordered, card-like container. */
  boxedArticles: false,
  /** Allow listing cards to grow when title/description content is longer. */
  dynamicPostCardHeight: false,
  /** Automatically generate Open Graph images for posts that don't have a `heroImage`. */
  autoOgImage: true,
  /** Show a link to the Privacy Policy page in the footer. */
  showPrivacyPolicy: true,
  /** Footer text controls. */
  footer: {
    /**
     * Optional full override for the left footer line. Supports {year} and {author}.
     * Default when undefined: "© {year} {author}. All rights reserved." (+ Privacy Policy link if enabled).
     */
    leftText: undefined,
    /**
     * Optional custom text for the right footer line.
     * Leave undefined to hide the right footer line.
     */
    rightText: undefined,
    /** Whether to show the Privacy Policy link in the footer. */
    showPrivacyPolicy: true,
  },

  // ==========================================
  // ❗ CAN BREAK THINGS (EDIT WITH CAUTION)
  // ==========================================

  /** Public URL of the deployed site, no trailing slash. Breaks SEO/RSS if incorrect. */
  // `||` (not `??`) so an explicitly empty `SITE_URL=` in `.env` also
  // falls back to the default. Astro requires `site` to be a valid URL.
  url: import.meta.env.SITE_URL || 'https://costeer.dev',
  /** Supported locales. Changing this requires adding/removing locale folders, content, and i18n entries. */
  locales: locales,
  /** Default locale. Changing this is a breaking, atomic, multi-file operation. */
  defaultLocale: 'en',
  /** Show the language switcher and link to translated pages. */
  multilingual: true,
};

export const NAV: readonly NavItem[] = [
  { key: 'home', href: '/', icon: 'lucide:home' },
  { key: 'categories', href: '/categories', icon: 'lucide:layers' },
  { key: 'tags', href: '/tags', icon: 'lucide:tag' },
  { key: 'about', href: '/about', icon: 'lucide:info' },
] as const;

/**
 * SOCIALS is built from the env-driven handles above so users only edit
 * one place (`.env` or the constants at the top of this file). Empty
 * handles are filtered out automatically — the icon simply won't appear
 * in the sidebar. RSS is always present.
 *
 * Need a social network the theme doesn't ship with? Just append a
 * literal entry below — the type is `SocialLink`.
 */
export const SOCIALS: readonly SocialLink[] = [
  CODEBERG_HANDLE && {
    label: 'Codeberg',
    href: `https://codeberg.org/${CODEBERG_HANDLE}`,
    icon: 'simple-icons:codeberg',
  },
  MASTODON_PROFILE_URL && {
    label: 'Mastodon',
    href: MASTODON_PROFILE_URL,
    icon: 'simple-icons:mastodon',
    rel: 'me noopener',
  },
  { label: 'RSS', href: '/rss.xml', icon: 'lucide:rss' },
].filter(Boolean) as SocialLink[];

/**
 * Mastodon comments. Set `enabled: false` to globally disable. Individual
 * posts may opt out via frontmatter `comments: false`.
 *
 * Each post should set `mastodonStatusUrl` in frontmatter to the public
 * Mastodon status announcing that blog post. Replies to that status are
 * rendered as comments.
 */
export const MASTODON_COMMENTS: MastodonCommentsConfig = {
  enabled: (import.meta.env.PUBLIC_MASTODON_COMMENTS_ENABLED ?? 'false') === 'true',
  instance: import.meta.env.PUBLIC_MASTODON_INSTANCE ?? 'https://mastodon.social',
  profileUrl: MASTODON_PROFILE_URL,
};

/**
 * Pagefind runtime settings. The index itself is generated by `bun run pagefind`
 * after `astro build` and written to `dist/_pagefind/`.
 */
export const PAGEFIND = {
  /** Public path where the Pagefind bundle is served. */
  bundlePath: '/_pagefind/',
  /** Number of results to render per locale. */
  pageSize: 10,
} as const;
