/** 友链数据，读取 src/content/_data/friends.json */
import fs from 'node:fs';
import path from 'node:path';

export interface Friend {
  title: string;
  description: string;
  link: string;
  avatar: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'src/content/_data');

let cache: Friend[] | null = null;

/** 读取友链；文件不存在返回空数组 */
export async function getFriends(): Promise<Friend[]> {
  if (cache) return cache;

  const file = path.join(DATA_DIR, 'friends.json');
  if (!fs.existsSync(file)) {
    cache = [];
    return cache;
  }

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      cache = [];
      return cache;
    }

    cache = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        title: String(item.title ?? '').trim(),
        description: String(item.description ?? '').trim(),
        link: String(item.link ?? '').trim(),
        avatar: String(item.avatar ?? '').trim(),
      }))
      .filter((item) => item.title && item.link);

    return cache;
  } catch (error) {
    console.warn(`[friends] failed to read ${file}: ${String(error)}`);
    cache = [];
    return cache;
  }
}
