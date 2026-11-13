#!/usr/bin/env node
// 同步 package.json 的版本号
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const version = process.argv[2]?.replace(/^v/, '');
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('用法: node tools/update-version.mjs <版本号>（例如 1.0.0）');
  process.exit(1);
}

const p = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.version = version;
fs.writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`版本号已更新至 ${version}`);
