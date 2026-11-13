import { site } from './site';

// 日期格式跟随站点语言
const LOCALE = site.lang || 'en';

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

export const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' }).format(date);

export const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { year: 'numeric', month: 'long' }).format(date);

/** 磁贴时间戳：yyyy/mm/dd */
export function formatCardDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

/** datetime 属性用 */
export const formatCardDateISO = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** 相对时间 */
export function formatRelative(date: Date, now = new Date()) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatShortDate(date);
}

/** 阅读时长：中文 350 字/分，西文 200 词/分 */
export const readingTime = (body = '') => {
  const text = body.trim();
  if (!text) return 1;
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 350 + words / 200));
};

export const isoDate = (date: Date) => date.toISOString();

/** 从正文提取纯文本摘要 */
export function excerptFromBody(body: string, limit = 90) {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
}
