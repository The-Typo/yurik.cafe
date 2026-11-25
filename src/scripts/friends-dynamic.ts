/**
 * 友链文章的前端拉取（dynamic 模式）。
 *
 * 静态渲染的友链在 HTML 里已有文章列表；标记为 dynamic 的留空，
 * 由这里按站点配置的间隔去拉。拉取失败就保持空白，不影响页面其它部分。
 *
 * 浏览器直接取订阅需要对方站点允许跨域（Access-Control-Allow-Origin），
 * 否则会被 CORS 拦下 —— 这种情况下只是安静地不显示，不报错。
 */
import { extractFeedPosts } from '../lib/feed-parser';
import { appendRef } from '../lib/ref-link';

interface FriendConfig {
  refreshMinutes: number;
  retries: number;
  timeoutMs: number;
}

/** 带超时的请求 */
async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml, */*',
      },
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
async function loadFriend(
  card: HTMLElement,
  tpl: HTMLTemplateElement,
  cfg: FriendConfig,
  ref: string
): Promise<void> {
  const feed = card.dataset.feed;
  const base = card.dataset.link ?? '';
  const limit = Number(card.dataset.limit ?? '3');
  if (!feed) return;

  const list = card.querySelector<HTMLElement>('[data-friend-posts]');
  if (!list) return;

  const attempts = Math.max(1, cfg.retries + 1);

  for (let i = 0; i < attempts; i++) {
    const xml = await fetchWithTimeout(feed, cfg.timeoutMs);
    if (!xml) continue;

    const posts = extractFeedPosts(xml, base, limit);
    if (posts.length === 0) return;

    // 从服务端渲染的模板克隆，节点带着 scoped 属性，样式与 build 模式一致
    const items: HTMLElement[] = [];
    for (const post of posts) {
      const li = tpl.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
      if (!li) continue;

      const a = li.querySelector<HTMLAnchorElement>('a');
      const span = li.querySelector('span');
      if (!a || !span) continue;

      a.href = appendRef(post.link, ref);
      a.title = post.title;
      span.textContent = post.title;
      items.push(li);
    }

    if (items.length === 0) return;
    list.replaceChildren(...items);
    card.dataset.loaded = 'true';
    return;
  }
}

/** 拉取所有 dynamic 友链 */
async function loadAll(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-friends-root]');
  const grid = document.querySelector<HTMLElement>('.friend-grid');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-friend-item-tpl]');
  if (!root || !grid || !tpl) return;

  const cfg: FriendConfig = {
    refreshMinutes: Number(root.dataset.refreshMinutes ?? '30'),
    retries: Number(root.dataset.retries ?? '1'),
    timeoutMs: Number(root.dataset.timeoutMs ?? '8000'),
  };
  const ref = grid.dataset.friendRef ?? '';

  const cards = [...grid.querySelectorAll<HTMLElement>('[data-friend-mode="dynamic"]')];
  if (cards.length === 0) return;

  await Promise.all(cards.map((card) => loadFriend(card, tpl, cfg, ref)));
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
