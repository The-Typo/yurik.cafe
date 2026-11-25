/**
 * 友链文章的前端拉取。
 *
 * 静态渲染的友链在 HTML 里已有文章列表；标记为 dynamic 的留空，
 * 由这里按站点配置的间隔去拉。拉取失败就把那块留空，不影响页面其它部分。
 *
 * 浏览器直接取订阅需要对方站点允许跨域（Access-Control-Allow-Origin），
 * 否则会被 CORS 拦下 —— 这种情况下退回 JSONP 式的第三方代理并不可取，
 * 所以只是安静地不显示，并在控制台留一条说明。
 */

interface FriendConfig {
  refreshMinutes: number;
  retries: number;
  timeoutMs: number;
}

interface Post {
  title: string;
  link: string;
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

function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    hellip: '…', mdash: '—', ndash: '–',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
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

/** 从 Atom 或 RSS 文本里抽条目，与 lib/friends.ts 保持同样规则 */
function parseFeed(xml: string, limit: number): Post[] {
  const posts: Post[] = [];

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

/** 带超时的请求 */
async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml, */*' },
      credentials: 'omit',
    });
    if (!res.ok) return null;

    const type = res.headers.get('content-type') ?? '';
    if (/text\/html/i.test(type)) return null;

    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 拉一个友链的订阅，失败按配置重试 */
async function loadFriend(card: HTMLElement, cfg: FriendConfig): Promise<void> {
  const feed = card.dataset.feed;
  const base = card.dataset.link ?? '';
  const limit = Number(card.dataset.limit ?? '3');
  if (!feed) return;

  const list = card.querySelector<HTMLElement>('[data-friend-posts]');
  const tpl = card.querySelector<HTMLTemplateElement>('[data-friend-template]');
  if (!list || !tpl) return;

  const attempts = Math.max(1, cfg.retries + 1);

  for (let i = 0; i < attempts; i++) {
    const xml = await fetchWithTimeout(feed, cfg.timeoutMs);
    if (!xml || !/<(feed|rss)\b/i.test(xml)) continue;

    const posts = parseFeed(xml, limit);
    if (posts.length === 0) return;

    // 从服务端渲染的模板克隆，节点带着 scoped 属性，样式与 build 模式一致
    list.replaceChildren(
      ...posts.map((post) => {
        const li = tpl.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
        if (!li) return null;

        const a = li.querySelector('a');
        const span = li.querySelector('span');
        if (!a || !span) return null;

        a.href = /^https?:/i.test(post.link)
          ? post.link
          : base.replace(/\/+$/, '') + (post.link.startsWith('/') ? '' : '/') + post.link;
        a.title = post.title;
        span.textContent = post.title;

        return li;
      }).filter((x): x is HTMLElement => x !== null)
    );

    card.dataset.loaded = 'true';
    return;
  }
}

/** 拉取所有 dynamic 友链 */
async function loadAll(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-friends-root]');
  if (!root) return;

  const cfg: FriendConfig = {
    refreshMinutes: Number(root.dataset.refreshMinutes ?? '30'),
    retries: Number(root.dataset.retries ?? '1'),
    timeoutMs: Number(root.dataset.timeoutMs ?? '8000'),
  };

  const cards = [...root.querySelectorAll<HTMLElement>('[data-friend-mode="dynamic"]')];
  if (cards.length === 0) return;

  await Promise.all(cards.map((card) => loadFriend(card, cfg)));
}

let timer: number | null = null;

function start(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }

  const root = document.querySelector<HTMLElement>('[data-friends-root]');
  if (!root) return;

  void loadAll();

  const minutes = Number(root.dataset.refreshMinutes ?? '30');
  if (!Number.isFinite(minutes) || minutes <= 0) return;

  // 页面在后台时不刷新，省流量
  timer = window.setInterval(() => {
    if (document.hidden) return;
    void loadAll();
  }, minutes * 60_000);
}

start();
document.addEventListener('astro:page-load', start);
