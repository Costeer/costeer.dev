/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly CI_SKIP_CONTENT_COLLECTIONS?: string;
  readonly CI_SKIP_RSS_SITEMAP?: string;
  readonly PUBLIC_MASTODON_COMMENTS_ENABLED?: string;
  readonly PUBLIC_MASTODON_INSTANCE?: string;
  readonly PUBLIC_MASTODON_PROFILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
