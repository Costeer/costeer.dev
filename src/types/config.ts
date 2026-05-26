import type { Locale } from '../config';
import type { ImageMetadata } from 'astro';

export interface SiteConfig {
  title: string;
  description: string;
  author: {
    name: string;
    url?: string;
    avatar?: string | ImageMetadata;
    bio?: string;
  };
  defaultOgImage: string;
  postsPerPage: number;
  isoDates: boolean;
  showFeaturedImages: boolean;
  boxedArticles: boolean;
  dynamicPostCardHeight: boolean;
  autoOgImage: boolean;
  showPrivacyPolicy: boolean;
  footer: {
    /** Optional full override for the left footer line. Supports {year} and {author}. */
    leftText?: string;
    /** Optional custom text shown before the theme link on the right footer line. */
    rightText?: string;
    /** Whether to show the Privacy Policy link in the footer. */
    showPrivacyPolicy?: boolean;
  };
  url: string;
  locales: readonly Locale[];
  defaultLocale: Locale;
  multilingual: boolean;
}

export interface NavItem {
  /** Unique key matching i18n.ts entries. */
  key: string;
  /** Path WITHOUT leading locale prefix. The renderer adds it. */
  href: string;
  /** Optional icon name (e.g. "home", "tags"). */
  icon?: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
  rel?: string;
}

export interface MastodonCommentsConfig {
  /** Master switch. */
  enabled: boolean;
  /** Optional default Mastodon instance origin, e.g. `https://mastodon.social`. */
  instance?: string;
  /** Optional profile URL used in setup/help copy. */
  profileUrl?: string;
}
