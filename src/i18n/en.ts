/**
 * Language: English
 * Author: Theme Author
 * BCP 47: en
 */

export default {
  // —— 通用 ——
  common: {
    post: 'Post',
    posts: 'Posts',
    tags: 'Tags',
    categories: 'Categories',
    words: 'Words',
    lastUpdated: 'Last updated',
    uptime: 'Uptime',
    uptimeDays: (n: number) => `${n}d`,
    uptimeHours: (n: number) => `${n}h`,
    uptimeSeconds: (n: number) => `${n}s`,
    minRead: 'min read',
    share: 'Share',
    copyLink: 'Copy link',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    backHome: 'Back home',
  },

  // —— 导航 ——
  nav: {
    site: 'Site',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  // —— 首页 ——
  home: {
    latest: 'Latest',
    allPosts: 'All posts',
    morePosts: 'More posts',
    viewAllPosts: 'View all posts',
    empty: 'No posts yet. Drop a Markdown file into src/content/posts and it will show up here.',
    galleryLabel: 'Post gallery',
  },

  // —— 归档 ——
  archive: {
    title: 'Archive',
    heading: 'All posts',
    description: 'Every post, newest first, grouped by month.',
    pagination: 'Archive pagination',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    empty: 'No posts yet.',
  },

  // —— 标签 / 分类 ——
  taxonomy: {
    tagsTitle: 'Tags',
    tagsDescription: 'Browse every post by tag.',
    categoriesTitle: 'Categories',
    categoriesDescription: 'Browse every post by category.',
    tag: 'Tag',
    category: 'Category',
    emptyTags: 'No tags yet. Add a tags list to a post’s frontmatter.',
    emptyCategories: 'No categories yet. Add a category to a post’s frontmatter.',
    postCount: (n: number) => (n === 1 ? '1 post' : `${n} posts`),
  },

  // —— 标签 / 分类详情 ——
  taxonomyDetail: {
    tagTitle: (name: string) => `Tag: ${name}`,
    tagDescription: (name: string) => `Posts tagged ${name}.`,
    categoryTitle: (name: string) => `Category: ${name}`,
    categoryDescription: (name: string) => `Posts filed under ${name}.`,
    noDescription: 'Nothing here yet.',
    emptyPosts: 'No posts in this category yet.',
    emptyTagged: 'No posts with this tag yet.',
  },

  // —— 日期 ——
  date: {
    monthDay: (month: number, day: number) => `${month}/${day}`,
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: (n: number) => `${n} days ago`,
    weeksAgo: (n: number) => `${n} weeks ago`,
  },

  // —— 文章页 ——
  post: {
    breadcrumb: 'Breadcrumb',
    backToArchive: 'Back to archive',
    related: 'Related',
  },

  // —— 文章页补充 ——
  postExtra: {
    writtenBy: 'Written by',
    related: 'Related posts',
  },

  // —— 页面 ——
  page: {
    about: 'About',
    page: 'Page',
  },

  // —— 404 ——
  notFound: {
    title: 'Page not found',
    heading: 'Page not found',
    description: 'The page you were looking for could not be found.',
    hint: 'The link may be out of date, or the article may have been moved to the archive.',
    browseArchive: 'Browse the archive',
  },

  // —— 主题切换 ——
  theme: {
    switch: 'Switch theme',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },

  // —— 页脚 ——
  footer: {
    label: 'Footer',
    rss: 'RSS',
    email: 'Email',
  },

  // —— 无障碍标签 ——
  a11y: {
    decorativeCover: 'Decorative cover artwork',
  },
};
