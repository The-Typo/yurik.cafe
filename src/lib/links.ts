/** 外链处理：给站外地址加上回访来源 */
import { site } from './site';
import { appendRef } from './ref-link';

/** 判断是否站外链接 */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * 给外链附加 ?ref=<本站地址>。
 *
 * 具体规则在 appendRef 里，客户端脚本也用同一份实现，
 * 这样水合时比较 href 才不会误判。
 */
export function withRef(href: string, ref: string = site.url): string {
  if (!href || !isExternal(href)) return href;
  return appendRef(href, ref);
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
