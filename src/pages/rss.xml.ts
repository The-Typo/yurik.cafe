import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../lib/site';
import { sortPosts, postHref } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = sortPosts(await getCollection('posts', ({ data }) => !data.draft));

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: postHref(post),
      categories: [...post.data.categories, ...post.data.tags],
    })),
    customData: `<language>${site.lang}</language>`,
  });
}
