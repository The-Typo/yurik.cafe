/**
 * Language: 简体中文
 * Author: Theme Author
 * BCP 47: zh-CN
 */

export default {
  // —— 通用 ——
  common: {
    post: '文章',
    posts: '文章',
    tags: '标签',
    categories: '分类',
    words: '总字数',
    lastUpdated: '最近更新',
    uptime: '运行时间',
    uptimeDays: (n: number) => `${n} 天`,
    uptimeHours: (n: number) => `${n} 时`,
    uptimeSeconds: (n: number) => `${n} 秒`,
    minRead: '分钟阅读',
    share: '分享',
    copyLink: '复制链接',
    copied: '已复制',
    copyFailed: '复制失败',
    backHome: '回到首页',
  },

  // —— 导航 ——
  nav: {
    site: '站内导航',
    skipToContent: '跳到正文',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },

  // —— 首页 ——
  home: {
    latest: '最新文章',
    allPosts: '全部归档',
    morePosts: '更多文章',
    viewAllPosts: '查看全部归档',
    empty: '还没有文章。把 Markdown 放进 src/content/posts 就会出现在这里。',
    galleryLabel: '文章画廊',
  },

  // —— 归档 ——
  archive: {
    title: '归档',
    heading: '全部归档',
    description: '按时间排列的全部文章。',
    pagination: '归档分页',
    previousPage: '上一页',
    nextPage: '下一页',
    empty: '还没有文章。',
  },

  // —— 标签 / 分类 ——
  taxonomy: {
    tagsTitle: '标签',
    tagsDescription: '按标签浏览全部文章。',
    categoriesTitle: '分类',
    categoriesDescription: '按分类浏览全部文章。',
    tag: '标签',
    category: '分类',
    emptyTags: '还没有标签。在文章 frontmatter 里加 tags 即可。',
    emptyCategories: '还没有分类。在文章 frontmatter 里加 categories 即可。',
    postCount: (n: number) => `${n} 篇`,
  },

  // —— 标签 / 分类详情 ——
  taxonomyDetail: {
    tagTitle: (name: string) => `标签：${name}`,
    tagDescription: (name: string) => `标记为 ${name} 的文章。`,
    categoryTitle: (name: string) => `分类：${name}`,
    categoryDescription: (name: string) => `${name} 分类下的文章。`,
    noDescription: '暂时还没有描述。',
    emptyPosts: '这个分类下还没有文章。',
    emptyTagged: '还没有文章使用这个标签。',
  },

  // —— 日期 ——
  date: {
    monthDay: (month: number, day: number) => `${month} 月 ${day} 日`,
    today: '今天',
    yesterday: '昨天',
    daysAgo: (n: number) => `${n} 天前`,
    weeksAgo: (n: number) => `${n} 周前`,
  },

  // —— 文章页 ——
  post: {
    breadcrumb: '面包屑',
    backToArchive: '返回归档',
    related: '相关文章',
  },

  // —— 文章页补充 ——
  postExtra: {
    writtenBy: '作者',
    related: '相关文章',
  },

  // —— 页面 ——
  page: {
    about: '关于',
    page: '页面',
  },

  // —— 404 ——
  notFound: {
    title: '页面不存在',
    heading: '页面不存在',
    description: '你找的页面可能已经被移动或删除。',
    hint: '链接可能已经过期，或者文章被移到了归档里。',
    browseArchive: '浏览归档',
  },

  // —— 主题切换 ——
  theme: {
    switch: '切换主题',
    toLight: '切换到亮色主题',
    toDark: '切换到暗色主题',
  },

  // —— 页脚 ——
  footer: {
    label: '页脚',
    rss: 'RSS',
    email: '邮箱',
  },

  // —— 无障碍标签 ——
  a11y: {
    decorativeCover: '装饰性封面图',
  },
};
