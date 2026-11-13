#!/usr/bin/env node
// 从 git 提交生成 CHANGELOG 段落
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = path.join(root, 'CHANGELOG.md');

const TYPE_MAP = {
  feat: '新增 | New',
  fix: '修复 | Fix',
  refactor: '改进 | Improved',
  perf: '改进 | Improved',
  docs: '文档 | Docs',
  ci: '自动化 | CI',
  build: '其他 | Other',
  style: '其他 | Other',
  test: '其他 | Other',
  chore: '其他 | Other',
};

const ORDER = [
  '新增 | New',
  '修复 | Fix',
  '改进 | Improved',
  '文档 | Docs',
  '自动化 | CI',
  '其他 | Other',
];

// 这些前缀不进 changelog
const IGNORE = /^(?:build|style|chore|test)\s*(?:\([^)]*\))?:\s*/;

function git(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { tag: null, base: null, all: false, outputOnly: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tag' || arg === '-t') opts.tag = args[++i];
    else if (arg === '--base' || arg === '-b') opts.base = args[++i];
    else if (arg === '--all' || arg === '-a') opts.all = true;
    else if (arg === '--output-only') opts.outputOnly = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`
用法: node tools/generate-changelog.mjs [选项]

  --tag, -t <标签>     发布标签名
  --base, -b <标签>    changelog 基准标签
  --all, -a            从最初提交开始
  --output-only        只输出到 stdout（供 CI 用）
  -h, --help           显示帮助
      `);
      process.exit(0);
    }
  }

  return opts;
}

function getCommits(base, all) {
  let cmd;
  if (all) cmd = 'log HEAD --pretty=format:"%H%n%aN%n%s"';
  else if (base) cmd = `log ${base}..HEAD --pretty=format:"%H%n%aN%n%s"`;
  else cmd = 'log --pretty=format:"%H%n%aN%n%s" -n 50';

  const output = git(cmd);
  if (!output) return [];

  const lines = output.split('\n');
  const commits = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    commits.push({ hash: lines[i], author: lines[i + 1], message: lines[i + 2] });
  }
  return commits;
}

function classify(commits) {
  const groups = Object.fromEntries(ORDER.map((c) => [c, []]));

  for (const commit of commits) {
    if (commit.message.includes('[skip changelog]')) continue;
    if (IGNORE.test(commit.message)) continue;

    const match = commit.message.match(/^(\w+)(?:\([\w-]+\))?:\s*/);
    const category = match ? (TYPE_MAP[match[1].toLowerCase()] ?? '其他 | Other') : '其他 | Other';
    const message = match ? commit.message.slice(match[0].length) : commit.message;

    groups[category].push({ message, author: commit.author });
  }

  return { groups };
}

function repoUrl() {
  const remote = git('remote get-url origin');
  if (!remote) return null;
  return remote.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
}

function render({ groups }, tag, base) {
  const lines = [];
  const url = repoUrl();

  lines.push(`## ${tag || 'Unreleased'}`);

  if (base && url) {
    lines.push(`> [${base}...${tag || 'HEAD'}](${url}/compare/${base}...${tag || 'HEAD'})`);
  } else if (base) {
    lines.push(`> ${base} ... ${tag || 'HEAD'}`);
  }
  lines.push('');

  for (const category of ORDER) {
    if (groups[category].length === 0) continue;

    lines.push(`### ${category}`, '');
    for (const item of groups[category]) {
      const suffix = item.author && url ? ` @${item.author}` : '';
      lines.push(`* ${item.message}${suffix}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const opts = parseArgs();

  if (!opts.base && !opts.all) {
    console.error('⚠️  未指定 --base 或 --all，仅统计最近 50 条提交');
  }

  const commits = getCommits(opts.base, opts.all);
  if (commits.length === 0) {
    console.error('⚠️  没有找到提交记录');
    return;
  }

  const markdown = render(classify(commits), opts.tag, opts.base);

  if (!opts.outputOnly) {
    fs.appendFileSync(changelogPath, `\n${markdown}`, 'utf8');
    console.error('✅ 已追加到 CHANGELOG.md');
  }

  console.log(markdown);
}

main();
