#!/usr/bin/env node
// 生成周快照版本号：YYwW 格式（例如 26w46a）
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

/** 年份后两位 */
function getYearSuffix() {
  return new Date().getFullYear().toString().slice(-2);
}

/** ISO 周数 */
function getWeekNumber() {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/** 所有周快照标签 */
function getWeeklySnapshotTags() {
  return git('tag -l')
    .split('\n')
    .filter(Boolean)
    .filter((tag) => /^\d{2}w\d{1,2}[a-z]$/.test(tag))
    .sort();
}

/** 指定周的快照标签 */
function getSnapshotsForWeek(yearSuffix, weekNum) {
  const prefix = `${yearSuffix}w${weekNum}`;
  return getWeeklySnapshotTags().filter((tag) => tag.startsWith(prefix));
}

/** 本周下一个字母 */
function getNextLetter(existingTags) {
  if (existingTags.length === 0) return 'a';

  const letters = existingTags
    .map((tag) => tag.match(/^\d{2}w\d{1,2}([a-z])$/)?.[1] ?? '')
    .filter(Boolean)
    .sort();

  const last = letters[letters.length - 1];
  if (!last) return 'a';

  const code = last.charCodeAt(0);
  if (code >= 122) throw new Error('已达到本周最大快照数量 (z)');

  return String.fromCharCode(code + 1);
}

/** 生成下一个快照版本号 */
function generateNextSnapshotVersion() {
  const yearSuffix = getYearSuffix();
  const weekNum = getWeekNumber();
  const existing = getSnapshotsForWeek(yearSuffix, weekNum);
  return `${yearSuffix}w${weekNum}${getNextLetter(existing)}`;
}

/** 最近的 tag，作为 changelog 基准 */
function getBaseTag() {
  const tags = git('tag -l --sort=-creatordate').split('\n').filter(Boolean);
  return tags.length > 0 ? tags[0] : null;
}

function main() {
  try {
    if (process.argv.includes('--get-base-tag')) {
      console.log(getBaseTag() || '');
      return;
    }

    const version = generateNextSnapshotVersion();
    console.log(version);

    if (process.argv.includes('--verbose')) {
      console.error(`年份后两位: ${getYearSuffix()}`);
      console.error(`周数: ${getWeekNumber()}`);
      console.error(`基础标签: ${getBaseTag() || '无'}`);
      console.error(`下一个快照版本: ${version}`);
    }
  } catch (error) {
    console.error('生成周快照版本号失败:', error.message);
    process.exit(1);
  }
}

export {
  getYearSuffix,
  getWeekNumber,
  getWeeklySnapshotTags,
  getSnapshotsForWeek,
  getNextLetter,
  generateNextSnapshotVersion,
  getBaseTag,
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) main();
