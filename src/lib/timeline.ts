/** 时间轴：本站文章与友链文章按时间合并 */
import { getAllPosts, postHref, type Post } from './posts';
import { getFriendsWithPosts } from './friends';
import { postCover } from './covers';
import { withRef } from './links';
import { formatDate, formatMonth } from './format';
import { site } from './site';

/** 时间轴上的条目 */
export interface TimelineEntry {
  kind: 'self' | 'friend';
  title: string;
  link: string;
  date: Date;
  /** self 才有 */
  post?: Post;
  /** friend 才有 */
  site?: {
    title: string;
    link: string;
    avatar: string;
  };
}

/** 按月分组 */
export interface TimelineGroup {
  key: string;
  year: number;
  month: number;
  items: TimelineEntry[];
}

export interface TimelineOptions {
  /** 最多输出几条 */
  limit?: number;
  /** 是否包含本站文章 */
  includeSelf?: boolean;
  /** 是否包含友链文章；只看 mode 为 build 的 */
  includeFriends?: boolean;
  /** 友链每站取几条 */
  friendPosts?: number;
}

/**
 * 合并时间轴。
 *
 * 友链只取 mode === 'build' 的条目：dynamic 的文章在构建期没有数据，
 * 拿不到日期就没法排序。
 */
export async function getTimeline(options: TimelineOptions = {}): Promise<TimelineEntry[]> {
  const {
    limit = 50,
    includeSelf = true,
    includeFriends = true,
    friendPosts = 3,
  } = options;

  const entries: TimelineEntry[] = [];

  if (includeSelf) {
    for (const post of await getAllPosts()) {
      entries.push({
        kind: 'self',
        title: post.data.title,
        link: postHref(post),
        date: post.data.date,
        post,
      });
    }
  }

  if (includeFriends) {
    const friends = await getFriendsWithPosts(friendPosts);

    for (const friend of friends) {
      // dynamic 模式构建期没有文章，跳过
      if (friend.mode !== 'build') continue;

      const origin = {
        title: friend.title || site.name,
        link: friend.link,
        avatar: friend.avatar,
      };

      for (const post of friend.posts) {
        // 没有日期的条目没法排序，不放进时间轴
        if (!post.date) continue;

        entries.push({
          kind: 'friend',
          title: post.title,
          link: post.link,
          date: post.date,
          site: origin,
        });
      }
    }
  }

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return entries.slice(0, limit);
}

/** 按年月分组，保持时间倒序 */
export function groupByMonth(entries: TimelineEntry[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];

  for (const item of entries) {
    const year = item.date.getFullYear();
    const month = item.date.getMonth() + 1;
    const key = `${year}-${month}`;

    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, year, month, items: [item] });
  }

  return groups;
}

/**
 * 按需加载用的分块。
 *
 * 块名由年月决定，不是流水号：新增一篇只改动它所在月份那一块，
 * 更早月份的文件名和内容都不变，部署时不会被重传。
 * 同一个月超过 perChunk 条时再切成 <年>-<月>.2、.3。
 */
export interface TimelineChunk {
  /** 文件名与 URL 的一段，如 2026-9 或 2026-9.2 */
  key: string;
  /** 所属月份，跨块时用来合并标题 */
  month: string;
  year: number;
  monthNum: number;
  items: TimelineEntry[];
}

export function chunkGroups(groups: TimelineGroup[], perChunk = 10): TimelineChunk[] {
  const size = Math.max(1, perChunk);
  const chunks: TimelineChunk[] = [];

  for (const group of groups) {
    for (let i = 0; i * size < group.items.length; i++) {
      chunks.push({
        key: i === 0 ? group.key : `${group.key}.${i + 1}`,
        month: group.key,
        year: group.year,
        monthNum: group.month,
        items: group.items.slice(i * size, (i + 1) * size),
      });
    }
  }

  return chunks;
}

/**
 * 首屏要凑够 minItems 条，所以可能吃掉好几块；
 * 剩下的块才交给浏览器按需取。
 */
export function splitChunks(
  chunks: TimelineChunk[],
  minItems: number
): { inline: TimelineChunk[]; rest: TimelineChunk[] } {
  const inline: TimelineChunk[] = [];
  let count = 0;

  for (const chunk of chunks) {
    if (count >= minItems) break;
    inline.push(chunk);
    count += chunk.items.length;
  }

  return { inline, rest: chunks.slice(inline.length) };
}

/** 把块还原成分组，同一月份被切开的多块合并回一个标题 */
export function chunksToGroups(chunks: TimelineChunk[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];

  for (const chunk of chunks) {
    const last = groups[groups.length - 1];
    if (last && last.key === chunk.month) last.items.push(...chunk.items);
    else {
      groups.push({
        key: chunk.month,
        year: chunk.year,
        month: chunk.monthNum,
        items: [...chunk.items],
      });
    }
  }

  return groups;
}

/**
 * 分组标题，跟着界面语言走。
 * 用 UTC 的第一天构造日期，避免本地时区把它推到上一个月。
 */
export function monthLabel(year: number, month: number): string {
  return formatMonth(new Date(Date.UTC(year, month - 1, 1)));
}

/** 缩略图：本站用封面，友链用对方头像 */
export function thumbFor(entry: TimelineEntry): string {
  if (entry.kind === 'self' && entry.post) return postCover(entry.post)?.src ?? '';
  return entry.site?.avatar ?? '';
}

/** 交给浏览器的条目；日期在构建期格式化好，免得各端时区不同 */
export interface TimelinePayloadItem {
  kind: 'self' | 'friend';
  title: string;
  /** 已经带 ?ref= 的地址 */
  link: string;
  dateISO: string;
  dateLabel: string;
  thumb: string;
  /** 友链才有；同时带上站点主页，供徽章链接 */
  siteTitle?: string;
  siteLink?: string;
}

export interface TimelinePayload {
  key: string;
  month: string;
  heading: string;
  items: TimelinePayloadItem[];
}

/** 把一块转成可 JSON 化的结构 */
export function chunkToPayload(chunk: TimelineChunk): TimelinePayload {
  return {
    key: chunk.key,
    month: chunk.month,
    heading: monthLabel(chunk.year, chunk.monthNum),
    items: chunk.items.map((item) => ({
      kind: item.kind,
      title: item.title,
      link: withRef(item.link),
      dateISO: item.date.toISOString(),
      dateLabel: formatDate(item.date),
      thumb: thumbFor(item),
      siteTitle: item.site?.title,
      siteLink: item.site ? withRef(item.site.link) : undefined,
    })),
  };
}
