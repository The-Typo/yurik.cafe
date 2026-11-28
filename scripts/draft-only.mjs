/**
 * 判断本次推送是否只动了一篇「本来就是 draft」的文章。
 *
 * 只是草稿的增删改不会改变构建产物（Astro 不渲染 draft），
 * 命中时工作流可以跳过安装、渲染、部署和缓存清除。
 *
 * 环境变量：
 *   BEFORE / AFTER      推送前后的提交号（github.event.before/after）
 *   GITHUB_REPOSITORY   owner/repo，用于 Compare API
 *   GITHUB_TOKEN        Compare API 的凭据
 *
 * 输出 skip=true|false 和 reason，写进 GITHUB_OUTPUT。
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const before = (process.env.BEFORE ?? '').trim();
const after = (process.env.AFTER ?? 'HEAD').trim();
const repo = (process.env.GITHUB_REPOSITORY ?? '').trim();
const token = (process.env.GITHUB_TOKEN ?? '').trim();

/** 文章目录形如 src/content/posts/<year>/<slug>/ */
const POST_DIR = /^src\/content\/posts\/([^/]+)\/([^/]+)\//;

/** Compare API 一次最多返回 300 个文件 */
const API_FILE_LIMIT = 300;

function finish(skip, reason) {
  const text = String(reason).replace(/\s+/g, ' ').trim();
  console.log(`skip=${skip}  ${text}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `skip=${skip}\nreason=${text}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${skip ? '跳过构建' : '继续构建'}：${text}\n`);
  }
  process.exit(0);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function hasCommit(sha) {
  try {
    git(['cat-file', '-e', `${sha}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * 取变更文件列表。
 *
 * CI 的 checkout 是浅克隆，拿不到 before 的树，按 SHA 补取也会被
 * GitHub 拒绝（couldn't find remote ref），所以退回 Compare API。
 */
async function changedFiles() {
  if (hasCommit(before) && hasCommit(after)) {
    const raw = git(['diff', '--name-only', '--no-renames', before, after]);
    return { files: raw.split('\n').map((x) => x.trim()).filter(Boolean), source: 'git' };
  }

  if (!repo || !token) {
    throw new Error('本地没有基线提交，且缺少 Compare API 所需的变量');
  }

  const url = `https://api.github.com/repos/${repo}/compare/${before}...${after}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'byline-draft-check',
    },
  });

  if (!res.ok) {
    throw new Error(`Compare API 返回 ${res.status}`);
  }

  const data = await res.json();
  const files = Array.isArray(data.files) ? data.files.map((f) => f.filename) : [];

  if (files.length === 0 && data.files === undefined) {
    // 没有 files 字段说明比较未完成或没有差异
    return { files: [], source: 'api' };
  }
  if (files.length >= API_FILE_LIMIT) {
    throw new Error(`变更文件达到 Compare API 上限（${API_FILE_LIMIT}）`);
  }

  return { files, source: 'api' };
}

/** 读取某个提交里的 index.md，读不到返回 null */
function readIndex(rev, indexPath) {
  try {
    return git(['show', `${rev}:${indexPath}`]);
  } catch {
    return null;
  }
}

/** frontmatter 里的 draft 是否为真 */
function isDraft(text) {
  if (!text) return false;
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return false;
  return /^draft:\s*['"]?(true|yes|on|1)['"]?\s*$/im.test(fm[1]);
}

/** 当前这份 index.md 是否以源码形式可读（API 路径下依然要读树） */
async function readIndexAny(rev, indexPath) {
  const local = readIndex(rev, indexPath);
  if (local !== null) return local;

  if (!repo || !token) return null;

  // 走 Contents API 按提交读取
  const url = `https://api.github.com/repos/${repo}/contents/${indexPath}?ref=${rev}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github.raw',
      'user-agent': 'byline-draft-check',
    },
  });
  if (!res.ok) return null;
  return await res.text();
}

async function main() {
  if (!before || /^0+$/.test(before)) {
    finish(false, '没有可比较的基线提交（新分支或手动触发）');
  }

  let result;
  try {
    result = await changedFiles();
  } catch (error) {
    finish(false, `取不到变更列表：${String(error.message ?? error)}`);
  }

  const { files, source } = result;
  if (files.length === 0) {
    finish(false, '没有文件变更');
  }

  // 全部改动必须落在同一篇文章目录里
  const dirs = new Set();
  for (const file of files) {
    const m = file.match(POST_DIR);
    if (!m) finish(false, `改动涉及文章以外的文件：${file}`);
    dirs.add(`${m[1]}/${m[2]}`);
  }

  if (dirs.size !== 1) {
    finish(false, `改动涉及 ${dirs.size} 篇文章`);
  }

  const dirKey = [...dirs][0];
  const indexPath = `src/content/posts/${dirKey}/index.md`;

  const now = await readIndexAny(after, indexPath);
  if (now === null) {
    // 文章被删了：可能删的是已发布文章，需要重新部署
    finish(false, `文章已删除：${dirKey}`);
  }

  if (!isDraft(now)) {
    finish(false, '文章未标记为 draft');
  }

  const was = await readIndexAny(before, indexPath);
  if (was !== null && !isDraft(was)) {
    // 已发布改成草稿，产物会少这一篇，必须重新构建
    finish(false, '文章从已发布改为 draft，产物会变化');
  }

  finish(true, `只有草稿及其文件更新：${dirKey}（来源 ${source}）`);
}

await main();
