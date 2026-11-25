/**
 * 友链文章的客户端刷新（dynamic 模式）。
 *
 * dynamic 的卡片在构建期已经写好一份文章列表，这里负责让它跟上：
 * 打开页面时取一次，之后按 refreshMinutes 再取，
 * 只有内容真的变了才替换 DOM，所以不会闪。
 *
 * 只有构建期探测到对方允许跨域（有 data-friend-feed）才会走到这里；
 * 其余卡片纯静态，脚本不碰，也不会留下跨域报错。
 */
import { extractFeedPosts } from '../lib/feed-parser';
import { appendRef } from '../lib/ref-link';

interface FriendConfig {
  refreshMinutes: number;
  retries: number;
  timeoutMs: number;
}

interface Post {
  title: string;
  link: string;
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

/** 现有列表是否已经就是这批文章 */
function samePosts(list: Element | null, posts: Post[], ref: string): boolean {
  if (!list) return false;

  const links = [...list.querySelectorAll<HTMLAnchorElement>('a')];
  if (links.length !== posts.length) return false;

  return links.every(
    (a, i) => a.title === posts[i].title && a.getAttribute('href') === appendRef(posts[i].link, ref)
  );
}

/** 刷新一个卡片的文章列表 */
async function refreshCard(
  card: HTMLElement,
  tpl: HTMLTemplateElement,
  cfg: FriendConfig,
  ref: string
): Promise<void> {
  const feed = card.dataset.friendFeed;
  const base = card.dataset.link ?? '';
  const limit = Number(card.dataset.limit ?? '3');
  if (!feed) return;

  const body = card.querySelector('.friend-body');
  const list = card.querySelector<HTMLElement>('[data-friend-posts]');
  if (!body) return;

  const attempts = Math.max(1, cfg.retries + 1);

  for (let i = 0; i < attempts; i++) {
    const xml = await fetchWithTimeout(feed, cfg.timeoutMs);
    if (!xml) continue;

    const posts = extractFeedPosts(xml, base, limit);
    if (posts.length === 0) return;

    // 内容没变就别动 DOM
    if (samePosts(list, posts, ref)) {
      card.dataset.loaded = 'true';
      return;
    }

    // 节点从服务端模板克隆，带着 scoped 属性，样式与首屏一致
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

    if (list) {
      list.replaceChildren(...items);
    } else {
      const created = document.createElement('ul');
      created.className = 'friend-posts';
      created.dataset.friendPosts = '';
      created.append(...items);
      body.append(created);
    }

    card.dataset.loaded = 'true';
    return;
  }
}

/** 刷新所有可水合的 dynamic 卡片 */
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

  const cards = [
    ...grid.querySelectorAll<HTMLElement>('[data-friend-mode="dynamic"][data-friend-feed]'),
  ];
  if (cards.length === 0) return;

  await Promise.all(cards.map((card) => refreshCard(card, tpl, cfg, ref)));
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
