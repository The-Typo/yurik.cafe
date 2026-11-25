/** 友链数据与站点订阅解析 */
import fs from 'node:fs';
import path from 'node:path';
import { extractFeedPosts, parseFeed, type FriendPost } from './feed-parser';
import { site } from './site';

export { parseFeed, type FriendPost };

/** 文章列表的取法 */
export type FriendMode = 'build' | 'dynamic' | 'none';

export interface Friend {
  title: string;
  description: string;
  link: string;
  avatar: string;
  /** 订阅地址；留空则按常见路径探测 */
  feed?: string;
  /**
   * build   构建时抓取，写进 HTML（默认）
   * dynamic 访问时由浏览器拉取，按间隔刷新
   * none    不显示文章列表
   */
  mode: FriendMode;
}

export interface FriendWithPosts extends Friend {
  posts: FriendPost[];
  /**
   * 允许本站跨源读取的订阅地址。
   *
   * 只有对方回了 Access-Control-Allow-Origin 才有值；有值说明浏览器
   * 也能直接取，构建出来的静态列表可以随后续更新。
   */
  liveFeed?: string;
}

/** 抓到的订阅，附带对方是否允许浏览器跨源读取 */
export interface ResolvedFeed {
  url: string;
  xml: string;
  cors: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'src/content/_data');

/** 把配置值收成三个合法值之一 */
function normalizeMode(value: unknown): FriendMode {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'dynamic') return 'dynamic';
  if (v === 'none' || v === 'off') return 'none';
  return 'build';
}

/** 站点没写 feed 时按这个顺序试 */
const FEED_GUESSES = ['/atom.xml', '/rss.xml', '/feed.xml', '/feed', '/index.xml', '/rss'];

/**
 * 单个订阅的下载上限。
 *
 * 有的站点把全文塞进 feed，八百多 KB 并不少见；CI 跑在境外机房，
 * 访问国内站点的链路又慢又抖，8 秒会把它们随机砍掉。
 */
const FETCH_TIMEOUT = 20000;

/** 失败后再试的次数；一次抖动不该让整站文章消失 */
const FETCH_ATTEMPTS = 2;

/** 本站 origin，用于判断对方是否允许我们跨源读取 */
const SITE_ORIGIN = (() => {
  try {
    return new URL(site.url).origin;
  } catch {
    return site.url.replace(/\/+$/, '');
  }
})();

/** 构建期同一地址只拉一次：页面和分页 JSON 会各算一遍时间轴 */
const feedCache = new Map<string, ResolvedFeed | null>();

/** 正在进行的请求，避免并发时对同一地址重复下载 */
const inflight = new Map<string, Promise<ResolvedFeed | null>>();

let cache: Friend[] | null = null;

/** 读取友链；文件不存在返回空数组 */
export async function getFriends(): Promise<Friend[]> {
  if (cache) return cache;

  const file = path.join(DATA_DIR, 'friends.json');
  if (!fs.existsSync(file)) {
    cache = [];
    return cache;
  }

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      cache = [];
      return cache;
    }

    cache = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        title: String(item.title ?? '').trim(),
        description: String(item.description ?? item.desc ?? '').trim(),
        link: String(item.link ?? '').trim(),
        avatar: String(item.avatar ?? '').trim(),
        feed: String(item.feed ?? '').trim() || undefined,
        mode: normalizeMode(item.mode),
      }))
      .filter((item) => item.title && item.link);

    return cache;
  } catch (error) {
    console.warn(`[friends] failed to read ${file}: ${String(error)}`);
    cache = [];
    return cache;
  }
}

/** 响应头是否允许本站浏览器跨源拉取 */
export function allowsBrowserCors(allowOrigin: string | null, siteOrigin = SITE_ORIGIN): boolean {
  if (!allowOrigin) return false;
  const trimmed = allowOrigin.trim();
  return trimmed === '*' || trimmed === siteOrigin;
}

/**
 * 取一次。
 *
 * 明确拿不到东西（非 2xx、回的是 HTML）返回 null，不必重试；
 * 网络错误和超时则抛出去，交给上层决定是否再试。
 */
async function fetchOnce(url: string): Promise<ResolvedFeed | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // 带 Origin 才能看出对方愿不愿意让浏览器跨源读取
        'user-agent': 'Mozilla/5.0 (compatible; BylineBot/1.0)',
        accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml, */*',
        origin: SITE_ORIGIN,
      },
      redirect: 'follow',
    });

    // 这些状态重试没有意义
    if (!res.ok) return null;

    // 有的站点对任何路径都回 HTML，这类排除
    const type = res.headers.get('content-type') ?? '';
    if (/text\/html/i.test(type)) return null;

    const xml = await res.text();
    const cors = allowsBrowserCors(res.headers.get('access-control-allow-origin'));
    return { url: res.url || url, xml, cors };
  } finally {
    clearTimeout(timer);
  }
}

/** 带超时与重试的抓取，全部失败才返回 null */
async function tryFetch(url: string): Promise<ResolvedFeed | null> {
  if (feedCache.has(url)) return feedCache.get(url) ?? null;

  // 并发调用共用同一个请求
  const running = inflight.get(url);
  if (running) return running;

  const task = (async () => {
    for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
      try {
        const resolved = await fetchOnce(url);
        // 明确的失败（404 / HTML）不重试
        if (resolved !== null) {
          feedCache.set(url, resolved);
          return resolved;
        }
        return null;
      } catch (error) {
        const last = attempt === FETCH_ATTEMPTS;
        if (last) {
          console.warn(`[friends] ${url} failed after ${attempt} attempts: ${String(error)}`);
          // 网络问题不写进缓存，让后续页面还有机会再试
          return null;
        }
        // 抖一下再试，避免同一时刻又撞上拥塞
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }

    return null;
  })();

  inflight.set(url, task);

  try {
    return await task;
  } finally {
    inflight.delete(url);
  }
}

/** 找订阅地址：先看配置，再按常见路径探测 */
export async function resolveFeed(friend: Friend): Promise<ResolvedFeed | null> {
  const looksLikeFeed = (fetched: ResolvedFeed | null): fetched is ResolvedFeed =>
    !!fetched && /<(feed|rss)\b/i.test(fetched.xml);

  if (friend.feed) {
    const fetched = await tryFetch(friend.feed);
    return looksLikeFeed(fetched) ? fetched : null;
  }

  const base = friend.link.replace(/\/+$/, '');
  for (const guess of FEED_GUESSES) {
    const fetched = await tryFetch(base + guess);
    if (looksLikeFeed(fetched)) return fetched;
  }

  return null;
}

/**
 * 取友链各自的最近文章。
 *
 * build 与 dynamic 都在构建期抓一次：前者就是最终内容，后者作为首屏内容，
 * 之后由浏览器按间隔刷新。none 从一开始就不显示列表。
 */
export async function getFriendsWithPosts(limit = 3): Promise<FriendWithPosts[]> {
  const friends = await getFriends();

  return Promise.all(
    friends.map(async (friend) => {
      if (friend.mode === 'none') return { ...friend, posts: [] };

      const resolved = await resolveFeed(friend);
      if (!resolved) return { ...friend, posts: [] };

      const posts = extractFeedPosts(resolved.xml, friend.link, limit);

      return {
        ...friend,
        posts,
        // 对方允许跨源读取时，把地址交给前端做增量刷新
        ...(resolved.cors ? { liveFeed: resolved.url } : {}),
      };
    })
  );
}
