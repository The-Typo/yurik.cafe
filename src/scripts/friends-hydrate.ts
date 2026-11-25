/**
 * 友链文章的增量刷新（build 模式，且对方允许跨域）。
 *
 * 这些卡片的文章已经由构建期写进 HTML，这里是锦上添花：页面打开后
 * 重新取一次订阅，只有内容真的变了才替换 DOM，所以不会闪。
 *
 * 对方没有 CORS 头时构建期不会给出 data-friend-feed，这里自然跳过，
 * 也不会在控制台留下跨域错误。取不到就保持静态内容不变。
 */
import { extractFeedPosts } from '../lib/feed-parser';
import { appendRef } from '../lib/ref-link';

const FETCH_TIMEOUT = 6000;

/** 现有列表是否已经就是这批文章 */
function samePosts(list: Element | null, posts: { title: string; link: string }[], ref: string): boolean {
  if (!list) return false;

  const links = [...list.querySelectorAll<HTMLAnchorElement>('a')];
  if (links.length !== posts.length) return false;

  return links.every(
    (a, i) => a.title === posts[i].title && a.getAttribute('href') === appendRef(posts[i].link, ref)
  );
}

async function refreshCard(
  card: HTMLElement,
  tpl: HTMLTemplateElement,
  ref: string,
  timeout: number
): Promise<void> {
  const feed = card.dataset.friendFeed;
  const base = card.dataset.link ?? '';
  const limit = Number(card.dataset.limit ?? '3');
  if (!feed) return;

  const body = card.querySelector('.friend-body');
  if (!body) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(feed, { signal: controller.signal, credentials: 'omit' });
    if (!res.ok) return;

    const type = res.headers.get('content-type') ?? '';
    if (/text\/html/i.test(type)) return;

    const posts = extractFeedPosts(await res.text(), base, limit);
    if (posts.length === 0 || !card.isConnected) return;

    const existing = body.querySelector('.friend-posts');
    if (samePosts(existing, posts, ref)) return;

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

    if (existing) {
      existing.replaceChildren(...items);
    } else {
      const list = document.createElement('ul');
      list.className = 'friend-posts';
      list.dataset.friendPosts = '';
      list.append(...items);
      body.append(list);
    }
  } catch {
    // 跨域受限或网络失败：保留构建期内容
  } finally {
    clearTimeout(timer);
  }
}

function start(): void {
  const grid = document.querySelector<HTMLElement>('.friend-grid');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-friend-item-tpl]');
  const root = document.querySelector<HTMLElement>('[data-friends-root]');
  if (!grid || !tpl) return;

  const ref = grid.dataset.friendRef ?? '';
  const timeout = Number(root?.dataset.timeoutMs ?? '6000') || FETCH_TIMEOUT;

  const cards = [
    ...grid.querySelectorAll<HTMLElement>('.friend-card[data-friend-feed]'),
  ].filter((card) => card.dataset.feedHydrated !== '1');

  if (cards.length === 0) return;

  for (const card of cards) {
    card.dataset.feedHydrated = '1';
    void refreshCard(card, tpl, ref, timeout);
  }
}

start();
document.addEventListener('astro:page-load', start);
