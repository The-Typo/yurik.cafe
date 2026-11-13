/** 封面解析：cover 字段 → 默认池 → 生成图 */
import type { ImageMetadata } from 'astro';
import type { Post } from './posts';
import { defaultCovers } from './site';

/** 文章目录下的图片 */
const images = import.meta.glob<ImageMetadata>('/src/content/posts/**/*.{webp,jpg,jpeg,png,avif,gif,svg}', {
  eager: true,
  import: 'default',
});

/** 默认封面池 */
const defaultPool = import.meta.glob<ImageMetadata>(
  '/src/assets/covers/*.{webp,jpg,jpeg,png,avif,gif,svg}',
  { eager: true, import: 'default' }
);

/** 按文件名排序 */
const defaultList = Object.keys(defaultPool)
  .sort()
  .map((key) => ({ key, name: key.split('/').pop() ?? key, meta: defaultPool[key] }));

export interface CoverInfo {
  src: string;
  width?: number;
  height?: number;
  /** 本地图片的原图元数据，交给 <Image> 生成合适尺寸 */
  meta?: ImageMetadata;
}

/** 拼 glob key */
const keyOf = (id: string, file: string) => {
  const clean = file.replace(/^\.?\//, '');
  return `/src/content/posts/${id}/${clean}`;
};

function resolveImage(id: string, file: string): CoverInfo | undefined {
  if (!file) return undefined;

  if (/^[a-z]+:\/\//i.test(file)) return { src: file };

  const candidate = file.startsWith('/')
    ? `/src/content/posts${file}`
    : keyOf(id, file);

  const mod = images[candidate];
  if (mod) {
    return { src: mod.src, width: mod.width, height: mod.height, meta: mod };
  }

  // 大小写不敏感匹配
  const lower = candidate.toLowerCase();
  const hit = Object.keys(images).find((k) => k.toLowerCase() === lower);
  if (hit) {
    const m = images[hit];
    return { src: m.src, width: m.width, height: m.height, meta: m };
  }

  return undefined;
}

/** 取文章封面，无 cover 时用默认池 */
export function postCover(post: Post): CoverInfo | undefined {
  const declared = post.data.coverFile;
  if (declared) {
    const resolved = resolveImage(post.id, declared);
    if (resolved) return resolved;
  }

  return pickDefaultCover(post.id);
}

/** 字符串哈希 */
function hashId(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 从默认池挑一张，按 id 哈希稳定选择 */
function pickDefaultCover(id: string): CoverInfo | undefined {
  if (!defaultCovers.enable || defaultList.length === 0) return undefined;

  // 按配置过滤并保持顺序
  const configured = defaultCovers.images.filter(Boolean);
  const pool =
    configured.length > 0
      ? configured
          .map((name) => defaultList.find((item) => item.name === name))
          .filter((item): item is (typeof defaultList)[number] => Boolean(item))
      : defaultList;

  if (pool.length === 0) return undefined;

  const item = pool[hashId(id) % pool.length];
  const meta = item.meta;
  if (!meta?.src) return undefined;

  return { src: meta.src, width: meta.width, height: meta.height, meta };
}

/** 只取显式配置的封面，不回退默认池 */
export function postDeclaredCover(post: Post): CoverInfo | undefined {
  const declared = post.data.coverFile;
  if (!declared) return undefined;
  return resolveImage(post.id, declared);
}
