import { getCollection, type CollectionEntry } from 'astro:content';
import { categoryOrder, site } from './site';

export type Post = CollectionEntry<'posts'>;


/** 按置顶、日期排序 */
export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => {
    const sticky = (b.data.sticky ?? 0) - (a.data.sticky ?? 0);
    if (sticky !== 0) return sticky;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

export async function getAllPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return sortPosts(posts);
}

/** 文章 URL：/year/slug/ */
export const postHref = (post: { id: string }) => `/${post.id}/`;

/** 统计分类 */
export function collectCategories(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const name of post.data.categories) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  const order = new Map(categoryOrder.map((name, index) => [name as string, index]));

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const ai = order.get(a.name) ?? 999;
      const bi = order.get(b.name) ?? 999;
      if (ai !== bi) return ai - bi;
      return b.count - a.count;
    });
}

export function collectTags(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const name of post.data.tags) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, site.lang));
}

/** 按年月分组 */
export function groupByMonth(posts: Post[]) {
  const groups: { key: string; date: Date; posts: Post[] }[] = [];
  for (const post of posts) {
    const date = post.data.date;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.posts.push(post);
    else groups.push({ key, date, posts: [post] });
  }
  return groups;
}
