/**
 * Atom / RSS 订阅解析。
 *
 * 构建期与浏览器水合共用，所以不能引用 node 内置模块。
 */

export interface FriendPost {
  title: string;
  link: string;
  /** 发布时间；feed 没给就留空 */
  date?: Date;
  /** 所属站点，时间轴用来区分来源 */
  site?: {
    title: string;
    link: string;
    avatar: string;
  };
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
export function decodeEntities(text: string): string {
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
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;

    const rel = attrs.match(/rel=["']([^"']+)["']/i)?.[1] ?? 'alternate';
    if (rel === 'alternate') return decodeEntities(href);
    if (!fallback) fallback = decodeEntities(href);
  }

  return fallback;
}

/**
 * 解析 feed 里的时间。
 *
 * Atom 用 ISO 8601，RSS 用 RFC 822，两种 Date 都能认。少数站点写
 * "2026-03-10 16:17:46" 这种缺时区的格式，浏览器会按本地时区理解，
 * 这里补成 UTC 以免不同机器构建出不同结果。
 */
function parseDate(raw: string | undefined): Date | undefined {
  const text = raw?.trim();
  if (!text) return undefined;

  // 先处理缺时区的写法：Date 会按本地时区理解它，构建机不同就得出不同时刻
  const naive = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
  if (naive) {
    const fixed = new Date(`${naive[1]}T${naive[2]}Z`);
    return Number.isNaN(fixed.getTime()) ? undefined : fixed;
  }

  const direct = new Date(text);
  return Number.isNaN(direct.getTime()) ? undefined : direct;
}

/** 从 Atom 或 RSS 文本里抽最近条目 */
export function parseFeed(xml: string, limit = 3): FriendPost[] {
  const posts: FriendPost[] = [];

  for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const title = pick(m[1], 'title');
    const link = atomLink(m[1]);
    if (!title || !link) continue;

    // Atom 优先 published，没有再退回 updated
    const date = parseDate(pick(m[1], 'published') || pick(m[1], 'updated'));
    posts.push({ title, link, date });
    if (posts.length >= limit) return posts;
  }

  if (posts.length) return posts;

  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = pick(m[1], 'title');
    const link =
      pick(m[1], 'link') ||
      decodeEntities(m[1].match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1] || '');
    if (!title || !link) continue;

    const date = parseDate(pick(m[1], 'pubDate') || pick(m[1], 'date') || pick(m[1], 'dc:date'));
    posts.push({ title, link, date });
    if (posts.length >= limit) return posts;
  }

  return posts;
}

/** 补全相对链接，并只放行 http(s) */
export function resolvePostLink(rawLink: string, baseLink: string): string | null {
  try {
    const resolved = new URL(rawLink, baseLink);
    return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.href : null;
  } catch {
    return null;
  }
}

/**
 * 解析订阅并过滤出可安全跳转的条目。
 *
 * 浏览器里也调用这个函数，所以这里对链接做协议限制——
 * feed 是别人的，不该让 javascript: 之类的东西进到 href。
 */
export function extractFeedPosts(xml: string, baseLink: string, limit = 3): FriendPost[] {
  if (!/<(feed|rss)\b/i.test(xml)) return [];

  const out: FriendPost[] = [];
  for (const post of parseFeed(xml, limit)) {
    const link = resolvePostLink(post.link, baseLink);
    if (link) out.push({ ...post, link });
  }
  return out;
}
