/** 外链处理：给站外地址加上回访来源 */
import { site } from './site';

/** 判断是否站外链接 */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * 给外链附加 ?ref=<本站地址>。
 *
 * - 站内相对路径、mailto:、tel:、锚点原样返回
 * - 已有 ref 参数不覆盖
 * - 已有其它查询参数时用 & 连接
 * - ref 值保持原样，不做百分号编码，方便对方在日志里直接读
 */
export function withRef(href: string, ref: string = site.url): string {
  if (!href || !isExternal(href)) return href;

  const base = ref.replace(/\/+$/, '');
  if (!base) return href;

  // 指向本站的绝对地址不算外链
  try {
    if (new URL(href).host === new URL(base).host) return href;
  } catch {
    // href 或 ref 不是合法 URL 时跳过这个判断
  }

  // 已经有 ref 就不再追加
  if (/[?&]ref=/i.test(href)) return href;

  // 拆出锚点，参数要加在它前面
  const hashAt = href.indexOf('#');
  const head = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : '';

  const sep = head.includes('?') ? '&' : '?';
  return `${head}${sep}ref=${base}${hash}`;
}

/**
 * 外链在 <a> 上的附加属性。
 *
 * 不用 noreferrer：它会让浏览器不发 Referer，友站就看不到来源，
 * 这也和 withRef 加 ?ref= 的用意相冲突。
 * noopener 必须留着，否则被打开的页面能通过 window.opener 改动本站。
 */
export const externalAttrs = {
  target: '_blank',
  rel: 'noopener',
} as const;
