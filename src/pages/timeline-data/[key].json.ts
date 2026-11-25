/**
 * 时间轴的后续分块。
 *
 * 文件名用年月而不是序号：新增文章只影响它所在月份那一块，
 * 更早月份的文件内容不变，部署时可以被跳过。
 *
 * 首屏那一块已经写进 HTML，这里只出剩下的。
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import {
  getTimeline,
  groupByMonth,
  chunkGroups,
  splitChunks,
  chunkToPayload,
} from '../../lib/timeline';

/** 找出启用时间轴的页面，用它的配置决定怎么分块 */
async function optionsFromContent() {
  const pages = await getCollection('pages', ({ data }) => !data.draft);
  const entry = pages.find((page) => page.data.timeline?.show);
  if (!entry) return null;

  const config = entry.data.timeline!;

  return {
    limit: config.limit ?? 50,
    includeSelf: config.includeSelf ?? true,
    includeFriends: config.includeFriends ?? true,
    friendPosts: config.friendPosts ?? 3,
    pageSize: config.pageSize ?? 10,
  };
}

async function chunksOf(options: NonNullable<Awaited<ReturnType<typeof optionsFromContent>>>) {
  const entries = await getTimeline(options);
  return chunkGroups(groupByMonth(entries), options.pageSize);
}

export const getStaticPaths = (async () => {
  const options = await optionsFromContent();
  if (!options) return [];

  const chunks = await chunksOf(options);
  const { rest } = splitChunks(chunks, options.pageSize);

  // 首屏已经渲染进页面，其余各出一份
  return rest.map((chunk) => ({
    params: { key: chunk.key },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const options = await optionsFromContent();
  const key = params.key ?? '';

  if (!options || !key) {
    return new Response('{}', {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const chunks = await chunksOf(options);
  const chunk = chunks.find((item) => item.key === key);

  if (!chunk) {
    return new Response('{}', {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(chunkToPayload(chunk)), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
