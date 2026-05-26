/* global Response */
import type { APIRoute } from 'astro';

import { SITE, type Locale } from '~/config';
import { localizedPath, useTranslations } from '~/i18n/utils';
import { getVisiblePosts } from '~/utils/posts';
import {
  homeFeedPage,
  homeFeedPageCount,
  renderHomeFeedPostHtml,
  serializeHomeFeedPost,
} from '~/utils/home-feed';

type Props = {
  locale: Locale;
  page: number;
};

export async function getStaticPaths() {
  const paths = [];

  for (const locale of SITE.locales) {
    const posts = await getVisiblePosts(locale);
    const lastPage = homeFeedPageCount(posts.length);
    const localeParam = locale === SITE.defaultLocale ? undefined : locale;

    for (let page = 2; page <= lastPage; page += 1) {
      paths.push({
        params: { locale: localeParam, page: String(page) },
        props: { locale, page },
      });
    }
  }

  return paths;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const posts = await getVisiblePosts(props.locale);
  const lastPage = homeFeedPageCount(posts.length);
  const nextPage = props.page < lastPage ? props.page + 1 : null;
  const t = useTranslations(props.locale);
  const pagePosts = await Promise.all(
    homeFeedPage(posts, props.page).map((post) => serializeHomeFeedPost(post, props.locale)),
  );

  return new Response(
    JSON.stringify({
      html: pagePosts
        .map((post, index) => renderHomeFeedPostHtml(post, index, { pinned: t('home.pinned') }))
        .join(''),
      posts: pagePosts,
      nextPage,
      nextUrl: nextPage ? `${localizedPath('/home-feed/', props.locale)}${nextPage}.json` : null,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },
  );
};
