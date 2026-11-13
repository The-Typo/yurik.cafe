/** 首页统计 */
import { site } from './site';
import { t } from '../i18n';

/** Markdown 转纯文本 */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[`*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 字数统计 */
export function countWords(markdown: string): number {
  const text = toPlainText(markdown);
  if (!text) return 0;
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latin = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length;
  return cjk + latin;
}

/** 总字数，按语言选单位（en → K/M，zh → 万） */
export function formatWordCount(total: number): string {
  if (total < 1000) return total.toLocaleString(site.lang);
  return new Intl.NumberFormat(site.lang, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(total);
}

/** 站点起算时刻 */
export const SITE_BIRTH_MS = Date.UTC(2022, 1, 10, 0, 0, 0);

/** 运行时长，单位跟随语言 */
export function formatUptime(now = Date.now()): string {
  const elapsed = Math.max(0, now - SITE_BIRTH_MS);
  const totalSeconds = Math.floor(elapsed / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const seconds = totalSeconds % 3600;
  return [
    t.common.uptimeDays(days),
    t.common.uptimeHours(hours),
    t.common.uptimeSeconds(seconds),
  ].join(' ');
}
