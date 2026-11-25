import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** 博文集，兼容 Hexo / Hugo frontmatter */
// 空 tags 会解析成 null
const list = z.union([z.string(), z.array(z.union([z.string(), z.number()])), z.null()]).optional();

const posts = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*', '!**/.*'], base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().nullish(),
      summary: z.string().nullish(),
      description: z.string().nullish(),
      excerpt: z.string().nullish(),
      categories: list,
      category: list,
      tags: list,
      tag: list,
      /** 封面文件名，相对文章目录 */
      cover: z.string().nullish(),
      banner: z.string().nullish(),
      image: z.string().nullish(),
      thumbnail: z.string().nullish(),
      coverAlt: z.string().nullish(),
      author: z.string().nullish(),
      sticky: z.coerce.number().nullish(),
      draft: z.boolean().default(false),
    })
    // 保留额外字段
    .passthrough()
    .transform((data) => {
      const toArray = (value: string | Array<string | number> | null | undefined) => {
        if (value === null || value === undefined) return [];
        const items = Array.isArray(value) ? value : [value];
        return items.map((item) => String(item).trim()).filter(Boolean);
      };

      return {
        ...data,
        categories: toArray(data.categories ?? data.category),
        tags: [...toArray(data.tags), ...toArray(data.tag)],
        summary: data.summary ?? data.description ?? data.excerpt ?? '',
        coverFile: (data.cover ?? data.banner ?? data.image ?? data.thumbnail ?? '')
          .replace(/^['"]+|['"]+$/g, '')
          .trim()
          .split('/')
          .pop() || '',
      };
    }),
});

/** 独立页面 */
const pages = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/.*'], base: './src/content/pages' }),
  schema: z
    .object({
      title: z.string(),
      /** 显式路由；不写则用目录结构 */
      path: z.string().nullish(),
      date: z.coerce.date().nullish(),
      description: z.string().nullish(),
      /** 友链开关 */
      friends: z
        .object({
          show: z.boolean().optional().default(false),
          siteTitle: z.string().optional().default('This site'),
          listTitle: z.string().optional().default('Friends'),
          /** 每站展示几条最近文章 */
          postCount: z.number().int().min(1).max(10).optional().default(3),
        })
        .nullish(),
      /** 时间轴开关 */
      timeline: z
        .object({
          show: z.boolean().optional().default(false),
          /** 最多几条 */
          limit: z.number().int().min(1).max(200).optional().default(50),
          /** 是否包含本站文章 */
          includeSelf: z.boolean().optional().default(true),
          /** 是否包含友链文章（只取 build 模式） */
          includeFriends: z.boolean().optional().default(true),
          /** 友链每站取几条 */
          friendPosts: z.number().int().min(1).max(10).optional().default(3),
          /** 首屏渲染几条，其余按需加载 */
          pageSize: z.number().int().min(1).max(50).optional().default(10),
        })
        .nullish(),
      draft: z.boolean().default(false),
    })
    .passthrough(),
});

export const collections = { posts, pages };
