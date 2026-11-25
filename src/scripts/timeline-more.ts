/**
 * 时间轴分块加载：点「加载更多」取下一块 JSON，用模板克隆节点插进列表。
 *
 * 用 <template> 而不是 createElement，是因为 scoped CSS 编译成了
 * 带 data-astro-cid 的选择器，脚本新建的节点拿不到那个属性，样式会丢。
 */

interface PayloadItem {
  kind: 'self' | 'friend';
  title: string;
  link: string;
  dateISO: string;
  dateLabel: string;
  thumb: string;
  siteTitle?: string;
  siteLink?: string;
}

interface PayloadChunk {
  key: string;
  month: string;
  heading: string;
  items: PayloadItem[];
}

interface ChunkPlan {
  key: string;
  count: number;
}

/** 已取到第几块；首屏那几块已经渲染过 */
let loaded = 0;

/** data-chunks 形如 2024-11:1,2024-9:3 */
function parseChunks(raw: string): ChunkPlan[] {
  return raw
    .split(',')
    .map((part) => {
      const at = part.lastIndexOf(':');
      if (at < 0) return null;
      const key = part.slice(0, at).trim();
      const count = Number(part.slice(at + 1));
      return key ? { key, count: Number.isFinite(count) && count > 0 ? count : 1 } : null;
    })
    .filter((item): item is ChunkPlan => item !== null);
}

function buildItem(
  item: PayloadItem,
  tpl: HTMLTemplateElement,
  selfLabel: string
): HTMLElement | null {
  const li = tpl.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
  if (!li) return null;

  li.classList.add(`tl-item--${item.kind}`);

  const thumbLink = li.querySelector<HTMLAnchorElement>('a.tl-thumb');
  const img = li.querySelector('img');
  const badge = li.querySelector<HTMLElement>('.tl-badge');
  const time = li.querySelector('time');
  const title = li.querySelector<HTMLAnchorElement>('.tl-title');

  if (!thumbLink || !img || !badge || !time || !title) return null;

  if (item.thumb) {
    thumbLink.href = item.link;
    img.src = item.thumb;
  } else {
    // 没有图就退成占位块
    const empty = document.createElement('span');
    empty.className = 'tl-thumb tl-thumb--empty';
    empty.setAttribute('aria-hidden', 'true');
    thumbLink.replaceWith(empty);
  }

  if (item.kind === 'friend' && item.siteTitle) {
    const siteLink = document.createElement('a');
    siteLink.className = 'tl-badge tl-badge--friend';
    siteLink.href = item.siteLink ?? '';
    siteLink.target = '_blank';
    siteLink.rel = 'noopener';
    siteLink.textContent = item.siteTitle;
    badge.replaceWith(siteLink);
  } else {
    badge.className = 'tl-badge tl-badge--self';
    badge.textContent = selfLabel;
  }

  time.dateTime = item.dateISO;
  time.textContent = item.dateLabel;

  title.href = item.link;
  title.textContent = item.title;
  if (item.kind === 'friend') {
    title.target = '_blank';
    title.rel = 'noopener';
    thumbLink.target = '_blank';
    thumbLink.rel = 'noopener';
  }

  return li;
}

function appendChunk(
  chunk: PayloadChunk,
  containers: HTMLElement,
  groupTpl: HTMLTemplateElement,
  itemTpl: HTMLTemplateElement,
  selfLabel: string
): void {
  // 同一月份被切成多块时接到已有分组后面，不再写一次标题
  let section = containers.querySelector<HTMLElement>(`[data-month-key="${chunk.month}"]`);
  let list: HTMLElement | null = null;

  if (section) {
    list = section.querySelector('.tl-list');
  } else {
    const node = groupTpl.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    if (!node) return;

    node.dataset.monthKey = chunk.month;
    const heading = node.querySelector('.tl-heading');
    if (heading) heading.textContent = chunk.heading;

    containers.append(node);
    section = node;
    list = node.querySelector('.tl-list');
  }

  if (!list) return;

  for (const item of chunk.items) {
    const li = buildItem(item, itemTpl, selfLabel);
    if (li) {
      li.dataset.timelineMonth = chunk.month;
      list.append(li);
    }
  }
}

async function loadMore(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return;

  const button = root.querySelector<HTMLButtonElement>('[data-timeline-more]');
  const note = root.querySelector<HTMLElement>('[data-timeline-note]');
  const containers = root.querySelector<HTMLElement>('[data-timeline-groups]');
  const groupTpl = root.querySelector<HTMLTemplateElement>('[data-timeline-group-tpl]');
  const itemTpl = root.querySelector<HTMLTemplateElement>('[data-timeline-item-tpl]');

  if (!button || !containers || !groupTpl || !itemTpl) return;

  const plan = parseChunks(root.dataset.chunks ?? '');
  if (loaded >= plan.length) return;

  const pageSize = Math.max(1, Number(root.dataset.pageSize ?? '10'));

  const label = button.textContent;
  button.disabled = true;
  button.textContent = button.dataset.loadingLabel ?? label;

  // 一块可能只有一两条，一次点击连取几块凑够一屏
  const start = loaded;
  const picked: string[] = [];
  let count = 0;

  while (loaded < plan.length && count < pageSize) {
    picked.push(plan[loaded].key);
    count += plan[loaded].count;
    loaded += 1;
  }

  try {
    const chunks = await Promise.all(
      picked.map(async (key) => {
        const res = await fetch(`/timeline-data/${key}.json`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as PayloadChunk;
        if (!data || !Array.isArray(data.items)) throw new Error('bad payload');
        return data;
      })
    );

    for (const chunk of chunks) {
      appendChunk(chunk, containers, groupTpl, itemTpl, root.dataset.selfLabel ?? '');
    }

    if (loaded >= plan.length) {
      button.remove();
      const end = button.dataset.endLabel ?? '';
      if (note && end) {
        note.hidden = false;
        note.textContent = end;
      }
    } else {
      button.disabled = false;
      button.textContent = label;
    }
  } catch {
    // 失败就把游标退回去，下次点击重试同一批
    loaded = start;
    button.disabled = false;
    button.textContent = label;
    if (note) {
      note.hidden = false;
      note.textContent = button.dataset.failedLabel ?? '';
    }
  }
}

let bound = false;

function start(): void {
  const root = document.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return;

  // swup 换页后根节点会被替换，重新绑定
  if (bound) loaded = 0;
  bound = true;

  root.querySelector('[data-timeline-more]')?.addEventListener('click', () => {
    void loadMore();
  });
}

start();
document.addEventListener('astro:page-load', start);
