/**
 * 站点配置。
 *
 * 只改这个文件就能把主题换成自己的站点，不需要动组件。
 */

import pkg from '../../package.json';

/**
 * 页脚版本号。
 *
 * CI 构建时由 Render & Push 工作流注入 GIT_VERSION（git 短哈希）；
 * 本地构建没有这个变量，退回 package.json 里的版本号。
 */
const buildVersion =
  (typeof process !== 'undefined' && process.env?.GIT_VERSION?.trim()) || `v${pkg.version}`;

// ---------------------------------------------------------------------------
// 基础信息
// ---------------------------------------------------------------------------
export const site = {
  /** 站点名，显示在导航栏与页脚 */
  name: '景蓝的小屋',
  /** 完整标题，用于 <title> 与 RSS */
  title: '景蓝的小屋',
  /** 一句话副标题，首页与 OG 描述用 */
  subtitle: '鲸落于海，星沉于洼',
  /** SEO 描述 */
  description: '记录技术、开箱与生活里的碎片。',
  /** SEO 关键词，逗号分隔 */
  keywords: '景蓝,Yurik,博客,技术,开箱,随笔',
  /** 站点地址，用于 canonical 与 RSS，末尾不要带斜杠 */
  url: 'https://yurik.cafe',
  /** <html lang> */
  lang: 'zh-CN',
  /** OG locale */
  locale: 'zh_CN',
  /** 作者名，用于 byline 与版权 */
  author: '景蓝 Yurik',
  /** 时区，影响日期格式化 */
  timezone: 'Asia/Shanghai',

  /**
   * 站点图标（导航栏左侧）。
   * - 留空则显示内置的方块占位图标
   * - 写 /favicon/v2/icon@256px.png 这类站点路径，或完整外链
   */
  logo: '/favicon/v2/android-chrome-512x512.png',
  /**
   * 站点 favicon（浏览器标签页图标）。
   * 留空则不输出 <link rel="icon">，由浏览器请求 /favicon.ico。
   */
  favicon: '/favicon/v2/favicon.ico',

  /** 首页顶部的一段自我介绍 */
  intro: {
    eyebrow: 'A Typo Project',
    heading: 'Hi，这里是景蓝的小屋',
    lead: '鲸落于海，星沉于洼',
  },

  /**
   * 导航栏。
   * description 只用于 SEO（生成 meta description 与 RSS），不影响显示。
   */
  globalNav: [
    { label: '首页', href: '/', description: '景蓝的小屋首页，最新文章与站点统计。' },
    { label: '归档', href: '/archive/', description: '按时间翻文章的地方，想找旧教程可以从这里慢慢往回看。' },
    { label: '标签', href: '/tags/', description: '按标签整理文章，技术、设备、游戏和日常内容都可以从这里分类浏览。' },
    { label: '友链', href: '/friends/', description: '这里放着一些朋友的博客和个人站点。' },
    { label: '关于', href: '/about/', description: '关于景蓝 / Yurik 的个人介绍、设备清单与版权说明。' },
    { label: '开往', href: 'https://www.travellings.cn/go.html' },
  ],
} as const;

// ---------------------------------------------------------------------------
// 页脚
// ---------------------------------------------------------------------------
export const footer = {
  /**
   * 社交链接。key 决定图标，常用的有：
   * rss / github / twitter / bluesky / weibo / zhihu / facebook / email
   * 留空字符串的条目不会显示。
   */
  social: {
    rss: '/rss.xml',
    github: 'https://github.com/ImJingLan',
    email: 'mailto:xisyphu@gmail.com',
    twitter: '',
    bluesky: '',
    weibo: '',
    zhihu: '',
    facebook: '',
  } as Record<string, string>,

  /** 备案信息；enable 为 false 时整条不显示 */
  icp: {
    enable: true,
    url: 'https://beian.miit.gov.cn',
    text: '桂ICP备2025057334号',
  },

  /** 版权行；{year} 与 {author} 会被替换 */
  copyright: 'Copyright © {year} {author}. All rights reserved.',
  /** 右下角的构建说明，留空则不显示 */
  credit: 'Built with Astro | {{GIT_VERSION}}',
} as const;

// ---------------------------------------------------------------------------
// Open Graph 图片
// ---------------------------------------------------------------------------
export const ogImage = {
  /** 是否生成分享图（需要 @resvg/resvg-js，见 README） */
  enable: false,
  /** 背景色 */
  bgColor: '#eaecf0',
  /** 主文字色 */
  fontColor: '#1e1e1e',
  /** 作者行文字色 */
  authorColor: '#444444',
} as const;

// ---------------------------------------------------------------------------
// 分页
// ---------------------------------------------------------------------------
export const pagination = {
  /** 归档页每页几篇 */
  archivePerPage: 6,
  /** 标签 / 分类详情页每页几篇 */
  taxonomyPerPage: 12,
} as const;

// ---------------------------------------------------------------------------
// 首页区块
// ---------------------------------------------------------------------------

/** In the Loop 画廊 */
export const gallery = {
  /** 是否显示整个画廊区块；设为 false 则整块不渲染 */
  enable: true,
  /** 左右翻页箭头 */
  showArrows: true,
  /** 底部圆点导航 */
  showDots: true,
  /**
   * 箭头位置：
   * - 'head'    与区块标题同一行，靠右（默认，最贴近编辑式排版）
   * - 'overlay' 悬浮在卡片两侧，鼠标悬停时显现
   */
  arrowPlacement: 'head' as 'head' | 'overlay',
  /** 画廊区块标题 */
  title: '随便看看',
  /** 从最新文章之后取几条 */
  count: 6,
} as const;

/** 「最新文章」区块 */
export const home = {
  /**
   * 展示几篇。
   * 1 篇做通栏头条，其余按 12 列网格铺开：
   *   6 篇 → 头条 1 + 两列 2 + 三列 3（刚好排满）
   *   5 篇 → 三列那行会空一格
   */
  latestCount: 6,
  /** 下面「更多文章」列表取几篇 */
  moreCount: 8,
  /** 是否显示统计表 */
  showStats: true,
} as const;

// ---------------------------------------------------------------------------
// 默认封面
// ---------------------------------------------------------------------------
/**
 * 文章没写 cover 时，从下面的列表里挑一张。
 *
 * 图片放这里：src/assets/covers/
 * 只写文件名即可，例如 '01.webp'，不需要写路径。
 * 目录为空或不配置时，回退到程序生成的抽象封面（CoverArt）。
 *
 * 选择规则：用文章 id 的哈希取模，所以同一篇文章每次构建都拿到同一张图，
 * 不会出现「刷新一次换一张」的情况。
 */
export const defaultCovers = {
  /** 是否启用 */
  enable: true,
  /** 图片文件名列表（相对 src/assets/covers/） */
  images: [] as string[],
} as const;

// ---------------------------------------------------------------------------
// 分类
// ---------------------------------------------------------------------------
/**
 * 分类直接来自文章 frontmatter，这里只放展示顺序与可选描述。
 * 未列出的分类会按文章数量自动排在后面。
 */
export const categoryOrder = ['技术', '开箱', '项目', '信竞', '随笔', '杂谈', '站点公告'] as const;

export const categoryDescriptions: Record<string, string> = {
  技术: '折腾记录：服务器、单片机、开发工具。',
  开箱: '买回来拆开、用一段时间、再写下来。',
  项目: '自己写的东西，以及为什么这么写。',
  信竞: '竞赛留下的算法与题解。',
  随笔: '生活里的一些片段。',
  杂谈: '没什么主题的碎碎念。',
  站点公告: '关于这个博客本身的变化。',
};

// ---------------------------------------------------------------------------
// 派生工具
// ---------------------------------------------------------------------------

/** 把分类名转成 URL 片段（中文分类也保持可读，浏览器会自动编码） */
export const categorySlug = (name: string) => encodeURIComponent(name);

export const categoryHref = (name: string) => `/categories/${categorySlug(name)}/`;
export const tagHref = (name: string) => `/tags/${encodeURIComponent(name)}/`;

export const categoryLabel = (name: string) => name;

/** 页脚社交链接：过滤空值，按固定顺序排列，便于稳定渲染 */
export const socialOrder = [
  'rss',
  'github',
  'twitter',
  'bluesky',
  'weibo',
  'zhihu',
  'facebook',
  'email',
] as const;

/** 把 social 对象整理成有序数组，空值自动跳过 */
export function socialLinks(): { key: string; label: string; href: string }[] {
  const labels: Record<string, string> = {
    rss: 'RSS',
    github: 'GitHub',
    twitter: 'Twitter',
    bluesky: 'Bluesky',
    weibo: '微博',
    zhihu: '知乎',
    facebook: 'Facebook',
    email: '邮箱',
  };

  const entries = footer.social as Record<string, string>;
  const known = socialOrder.filter((key) => entries[key]?.trim());
  // 配置里出现的其他 key 也一并保留，按字母序排在后面
  const extra = Object.keys(entries)
    .filter((key) => !(socialOrder as readonly string[]).includes(key) && entries[key]?.trim())
    .sort();

  return [...known, ...extra].map((key) => ({
    key,
    label: labels[key] ?? key,
    href: entries[key],
  }));
}

/** 替换版权行里的占位符 */
export function copyrightLine(): string {
  return footer.copyright
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{author}', site.author);
}

/** 替换构建说明里的 {{GIT_VERSION}} */
export function creditLine(): string {
  return footer.credit.replace('{{GIT_VERSION}}', buildVersion);
}

/**
 * 按导航路径查描述，用于 SEO。
 *
 * 路径写法不统一：内容 frontmatter 常写 `/about`，导航配置写 `/about/`。
 * 比较前统一去掉尾斜杠，避免因为一个斜杠查不到。
 */
export function navDescription(href: string): string | undefined {
  const norm = (p: string) => p.replace(/\/+$/, '') || '/';
  const target = norm(href);
  return site.globalNav.find((item) => norm(item.href) === target)?.description;
}

/** BCP 47 → og:locale（语言_地区），BaseLayout 用它输出 <meta property="og:locale"> */
export function ogLocale(lang: string = site.lang): string {
  const [base, region] = lang.split(/[-_]/);

  if (region) return `${base.toLowerCase()}_${region.toUpperCase()}`;

  const defaults: Record<string, string> = {
    en: 'US',
    zh: 'CN',
    ja: 'JP',
    ko: 'KR',
    pt: 'BR',
    es: 'ES',
    fr: 'FR',
    de: 'DE',
    ru: 'RU',
  };

  const fallback = defaults[base.toLowerCase()];
  return fallback ? `${base.toLowerCase()}_${fallback}` : base.toLowerCase();
}
