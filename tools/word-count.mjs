#!/usr/bin/env node
// 统计文章字数：逐篇 + 汇总
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countWords } from '../src/lib/stats.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(root, 'src', 'content', 'posts');

/** 去掉 frontmatter */
function stripFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return match ? markdown.slice(match[0].length) : markdown;
}

/** 取一个 frontmatter 字段 */
function field(frontmatter, name) {
  const m = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

/** 递归找 index.md */
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === 'index.md') out.push(full);
  }
  return out;
}

const files = walk(postsDir);

if (files.length === 0) {
  console.log('没有找到文章');
  process.exit(0);
}

const rows = files.map((file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = fm ? fm[1] : '';
  const body = stripFrontmatter(raw);

  return {
    path: path.relative(postsDir, file).replace(/\\/g, '/').replace(/\/index\.md$/, ''),
    title: field(frontmatter, 'title'),
    draft: field(frontmatter, 'draft') === 'true',
    words: countWords(body),
  };
});

rows.sort((a, b) => b.words - a.words);

const total = rows.reduce((sum, r) => sum + r.words, 0);
const published = rows.filter((r) => !r.draft);
const publishedTotal = published.reduce((sum, r) => sum + r.words, 0);

const width = Math.max(...rows.map((r) => r.words.toString().length), 5);

console.log('');
console.log('字数统计');
console.log('='.repeat(64));
for (const r of rows) {
  const flag = r.draft ? ' [draft]' : '';
  console.log(
    `  ${r.words.toString().padStart(width)}  ${r.path}${flag}`
  );
}
console.log('='.repeat(64));
console.log(`  ${publishedTotal.toString().padStart(width)}  已发布（${published.length} 篇）`);
if (published.length !== rows.length) {
  console.log(`  ${total.toString().padStart(width)}  含草稿（${rows.length} 篇）`);
}
console.log('');
