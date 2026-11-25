/**
 * 给外链附加 ?ref=<本站地址>。
 *
 * 不依赖任何模块，构建期与浏览器共用：页面用 withRef，客户端脚本用 appendRef，
 * 两边算出来的地址才能一致，水合时比较 href 才不会误判成“变了”。
 */
export function appendRef(href: string, ref: string): string {
  if (!href || !/^https?:\/\//i.test(href)) return href;

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
