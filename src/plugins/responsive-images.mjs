/**
 * 给正文里的图片生成 srcset。
 *
 * Markdown 的 `![](photo.webp)` 会渲染成原尺寸的 <img>，而正文栏只有
 * 700px 宽 —— 一张 1920px 的图放进 700px 的格子里是浪费。
 *
 * 做成 Astro 集成而不是 Vite 插件：需要等所有页面和资源都落盘之后才能
 * 改写，astro:build:done 是唯一能保证这一点的钩子。
 *
 * 只处理 /assets/ 下的本地图片，外链与 data URI 原样保留。
 * 没装 sharp 时静默跳过，不阻塞构建。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 正文栏 700；移动端满宽 390，2x 屏需要 780，所以 800 这一档很关键 */
const WIDTHS = [400, 600, 800, 1000, 1400];

const EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif']);

const BODY_IMG = /<img\b[^>]*\bsrc="(\/assets\/[^"]+)"[^>]*>/g;

/** 递归找 HTML */
function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

export default function responsiveImages(options = {}) {
  const widths = options.widths ?? WIDTHS;
  const quality = options.quality ?? 78;

  return {
    name: 'responsive-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // sharp 是可选依赖：没装就跳过，构建照常完成
        let sharp;
        try {
          ({ default: sharp } = await import('sharp'));
        } catch {
          logger.warn('sharp not installed, body images keep their source size');
          return;
        }

        const outDir = fileURLToPath(dir);
        if (!fs.existsSync(outDir)) return;

        const files = walkHtml(outDir);
        if (files.length === 0) return;

        /** 原图 url → 变体列表（null 表示不值得处理） */
        const variants = new Map();

        const build = async (url) => {
          if (variants.has(url)) return variants.get(url);

          const file = path.join(outDir, url.replace(/^\//, ''));
          if (!fs.existsSync(file) || !EXTS.has(path.extname(file).toLowerCase())) {
            variants.set(url, null);
            return null;
          }

          let meta;
          try {
            meta = await sharp(file).metadata();
          } catch {
            variants.set(url, null);
            return null;
          }

          const natural = meta.width ?? 0;
          const targets = natural ? widths.filter((w) => w < natural * 0.95) : [];
          if (targets.length === 0) {
            variants.set(url, null);
            return null;
          }

          const dirName = path.posix.dirname(url);
          const base = path.basename(url, path.extname(url));
          const list = [];

          for (const w of targets) {
            const outName = path.posix.join(dirName, `${base}-${w}w.webp`);
            const outFile = path.join(outDir, outName.replace(/^\//, ''));

            if (!fs.existsSync(outFile)) {
              const buf = await sharp(file)
                .resize({ width: w, withoutEnlargement: true })
                .webp({ quality })
                .toBuffer();
              fs.mkdirSync(path.dirname(outFile), { recursive: true });
              fs.writeFileSync(outFile, buf);
            }

            list.push({ url: outName, w });
          }

          // 原图作为最大一档，超大屏仍能取到
          list.push({ url, w: natural });

          variants.set(url, list);
          return list;
        };

        let pages = 0;
        let images = 0;

        for (const file of files) {
          const html = fs.readFileSync(file, 'utf8');
          const found = [...html.matchAll(BODY_IMG)].map((m) => m[1]);
          if (found.length === 0) continue;

          for (const src of new Set(found)) await build(src);

          let touched = 0;
          const out = html.replace(BODY_IMG, (tag, src) => {
            const list = variants.get(src);
            if (!list || list.length < 2) return tag;
            if (tag.includes('srcset=')) return tag;

            touched++;
            const srcset = list.map((v) => `${v.url} ${v.w}w`).join(', ');
            let next = tag.replace(
              /^<img\b/,
              `<img srcset="${srcset}" sizes="(min-width: 740px) 700px, calc(100vw - 44px)"`
            );

            if (!/\bloading=/.test(next)) next = next.replace(/^<img\b/, '<img loading="lazy"');
            if (!/\bdecoding=/.test(next)) next = next.replace(/^<img\b/, '<img decoding="async"');

            return next;
          });

          if (touched > 0) {
            fs.writeFileSync(file, out);
            pages++;
            images += touched;
          }
        }

        if (images > 0) {
          logger.info(`${images} body images across ${pages} pages now carry srcset`);
        }
      },
    },
  };
}
