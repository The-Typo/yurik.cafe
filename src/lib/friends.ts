/** 友链数据与站点订阅解析 */
import fs from 'node:fs';
import path from 'node:path';

export interface Friend {
  title: string;
  description: string;
  link: string;
  avatar: string;
  /** 订阅地址；留空则按常见路径探测 */
  feed?: string;
}

export interface FriendPost {
  title: string;
  link: string;
}

export interface FriendWithPosts extends Friend {
  posts: FriendPost[];
}

const DATA_DIR = path.resolve(process.cwd(), 'src/content/_data');

/** 站点没写 feed 时按这个顺序试 */
const FEED_GUESSES = ['/atom.xml', '/rss.xml', '/feed.xml', '/feed', '/index.xml', '/rss'];

const FETCH_TIMEOUT = 8000;

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
      }))
      .filter((item) => item.title && item.link);

    return cache;
  } catch (error) {
    console.warn(`[friends] failed to read ${file}: ${String(error)}`);
    cache = [];
    return cache;
  }
}

/** 带超时的抓取，失败返回 null */
async function tryFetch(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; BylineBot/1.0)',
        accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
    });

    if (!res.ok) return null;

    // 有的站点对任何路径都回 HTML，这类排除
    const type = res.headers.get('content-type') ?? '';
    if (/text\/html/i.test(type)) return null;

    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 取标签内的纯文本 */
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return '';

  return decodeEntities(
    m[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim()
  );
}

/** 解 HTML 实体；数字实体也要处理，标题里常见 &#038; &#124; */
function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    hellip: '…',
    mdash: '—',
    ndash: '–',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
  };

  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith('#')) {
      const code = body[1].toLowerCase() === 'x'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }

    return named[body.toLowerCase()] ?? whole;
  });
}

/** Atom 的 link 带 rel，优先 alternate */
function atomLink(block: string): string {
  let fallback = '';

  for (const [, attrs] of block.matchAll(/<link\b([^>]*)\/?>/gi)) {
    const href = attrs.match(/href="([^"]+)"/i)?.[1];
    if (!href) continue;

    const rel = attrs.match(/rel="([^"]+)"/i)?.[1] ?? 'alternate';
    if (rel === 'alternate') return href;
    if (!fallback) fallback = href;
  }

  return fallback;
}

/** 从 Atom 或 RSS 文本里抽最近条目 */
export function parseFeed(xml: string, limit = 3): FriendPost[] {
  const posts: FriendPost[] = [];

  for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const title = pick(m[1], 'title');
    const link = atomLink(m[1]);
    if (title && link) posts.push({ title, link });
    if (posts.length >= limit) return posts;
  }

  if (posts.length) return posts;

  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = pick(m[1], 'title');
    const link = pick(m[1], 'link') || m[1].match(/<link\b[^>]*href="([^"]+)"/i)?.[1] || '';
    if (title && link) posts.push({ title, link });
    if (posts.length >= limit) return posts;
  }

  return posts;
}

/** 找订阅地址：先看配置，再按常见路径探测 */
export async function resolveFeed(friend: Friend): Promise<string | null> {
  const looksLikeFeed = (xml: string | null): xml is string =>
    !!xml && /<(feed|rss)\b/i.test(xml);

  if (friend.feed) {
    const xml = await tryFetch(friend.feed);
    return looksLikeFeed(xml) ? xml : null;
  }

  const base = friend.link.replace(/\/+$/, '');
  for (const guess of FEED_GUESSES) {
    const xml = await tryFetch(base + guess);
    if (looksLikeFeed(xml)) return xml;
  }

  return null;
}

/** 取友链各自的最近文章；没有订阅的站点留空 */
export async function getFriendsWithPosts(limit = 3): Promise<FriendWithPosts[]> {
  const friends = await getFriends();

  return Promise.all(
    friends.map(async (friend) => {
      const xml = await resolveFeed(friend);
      if (!xml) return { ...friend, posts: [] };

      const posts = parseFeed(xml, limit).map((post) => ({
        ...post,
        // 相对链接补成绝对
        link: /^https?:/i.test(post.link)
          ? post.link
          : friend.link.replace(/\/+$/, '') + (post.link.startsWith('/') ? '' : '/') + post.link,
      }));

      return { ...friend, posts };
    })
  );
}
