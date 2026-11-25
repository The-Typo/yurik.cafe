/**
 * 部署后清除 Cloudflare 边缘缓存。
 *
 * 用到的变量：
 *   CLOUDFLARE_API_TOKEN   需要 Zone / Cache Purge 权限
 *   CLOUDFLARE_ZONE_ID     zone 的 ID
 *   CLOUDFLARE_SITE_URL    站点根地址，如 https://yurik.cafe
 *
 * 只按 URL 清除本站前缀，不动同账号下其它站点。任何一个变量缺失就跳过，
 * 不让缓存问题挡住部署本身。
 */

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const zone = process.env.CLOUDFLARE_ZONE_ID?.trim();
const site = process.env.CLOUDFLARE_SITE_URL?.trim().replace(/\/+$/, '');

function skip(reason) {
  console.log(`跳过缓存清除：${reason}`);
  process.exit(0);
}

if (!token) skip('未提供 CLOUDFLARE_API_TOKEN');
if (!zone) skip('未提供 CLOUDFLARE_ZONE_ID');
if (!site) skip('未提供 CLOUDFLARE_SITE_URL');

/**
 * Cloudflare 单次最多 30 个 URL，且按前缀清除需要逐个列出。
 * 这里只列会变的入口：页面、分块 JSON、RSS。
 */
async function listUrls() {
  const urls = [
    '/',
    '/friends/',
    '/timeline/',
    '/archive/',
    '/tags/',
    '/categories/',
    '/rss.xml',
    '/sitemap-index.xml',
  ];

  // 时间轴分块是构建产物，从本地目录读出实际文件名
  try {
    const fs = await import('node:fs/promises');
    const files = await fs.readdir('dist/timeline-data');
    for (const file of files) {
      if (file.endsWith('.json')) urls.push(`/timeline-data/${file}`);
    }
  } catch {
    // 没有这个目录说明时间轴没启用
  }

  return urls.map((path) => `${site}${path}`);
}

async function purge(urls) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    }
  );

  const data = await res.json();
  return { ok: res.ok && data.success === true, data };
}

const urls = await listUrls();
console.log(`准备清除 ${urls.length} 个 URL 的缓存`);

// 一次最多 30 个，分批发
let failed = 0;
for (let i = 0; i < urls.length; i += 30) {
  const batch = urls.slice(i, i + 30);
  const { ok, data } = await purge(batch);

  if (ok) {
    console.log(`  已清除 ${i + 1}-${i + batch.length}`);
  } else {
    failed += 1;
    console.error(`  批次 ${i + 1} 失败：`);
    for (const error of data.errors ?? []) {
      console.error(`    [${error.code}] ${error.message}`);
    }
  }
}

if (failed > 0) {
  // 缓存没清掉不影响站点已经部署的事实，标个警告退出即可
  console.log(`::warning::${failed} 个批次清除失败，缓存可能在 1 小时后自然过期`);
  process.exit(0);
}

console.log('缓存清除完成');