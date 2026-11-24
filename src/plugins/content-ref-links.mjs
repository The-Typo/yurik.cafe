/**
 * 给正文里的外链加上 ?ref=。
 *
 * Markdown 的 `[文字](https://...)` 会被渲染成普通的 <a>，没有回访来源。
 * 这个集成在改写 HTML 时补上，和友链、页脚保持同一套规则。
 *
 * 与 responsive-images 一样放在 astro:build:done：此时所有页面都已落盘。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 匹配带 http(s) 绝对地址的 <a> */
const EXTERNAL_A = /<a\b[^>]*\bhref="(https?:\/\/[^"]+)"[^>]*>/gi;

/** 递归找 HTML */
function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** 与 src/lib/links.ts 的 withRef 保持同样的规则 */
function withRef(href, ref) {
  const base = ref.replace(/\/+$/, '');
  if (!base) return href;

  try {
    if (new URL(href).host === new URL(base).host) return href;
  } catch {
    return href;
  }

  if (/[?&]ref=/i.test(href)) return href;

  const hashAt = href.indexOf('#');
  const head = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : '';
  const sep = head.includes('?') ? '&' : '?';

  return `${head}${sep}ref=${base}${hash}`;
}

export default function contentRefLinks(options = {}) {
  return {
    name: 'content-ref-links',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // site.url 从 astro.config 的 site 取，没配就跳过
        const ref = options.site ?? '';
        if (!ref) {
          logger.warn('site is not set, external links in content are left as-is');
          return;
        }

        const outDir = fileURLToPath(dir);
        if (!fs.existsSync(outDir)) return;

        let pages = 0;
        let links = 0;

        for (const file of walkHtml(outDir)) {
          const html = fs.readFileSync(file, 'utf8');
          let touched = 0;

          const out = html.replace(EXTERNAL_A, (tag, href) => {
            const next = withRef(href, ref);
            if (next === href) return tag;
            touched++;
            return tag.replace(`href="${href}"`, `href="${next}"`);
          });

          if (touched > 0) {
            fs.writeFileSync(file, out);
            pages++;
            links += touched;
          }
        }

        if (links > 0) {
          logger.info(`${links} external links in content now carry ?ref= across ${pages} pages`);
        }
      },
    },
  };
}
