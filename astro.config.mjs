import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import swup from '@swup/astro';
import contentAssets from './src/plugins/content-assets.mjs';
import responsiveImages from './src/plugins/responsive-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://yurik.cafe',
  // 原博客的链接都带尾斜杠，保持一致
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    assets: 'assets',
    // 样式内联进 <head>，去掉两次阻塞往返
    inlineStylesheets: 'always',
  },
  integrations: [
    // 正文图片按显示宽度生成 srcset（需在资源落盘后跑）
    responsiveImages(),
    swup({
      // 不用内置主题，动画全部写在 global.css 里
      theme: false,
      // 只替换 main，导航与页脚保持不动
      containers: ['main'],
      cache: true,
      // 悬停与进入视口即预取，点击时通常已经拿好 HTML
      preload: { hover: true, visible: true },
      // 非 HTML 端点不要劫持：它们没有 <main>，硬换会跳成裸文本
      ignore: [/\.(?:xml|rss|atom|txt|json)$/i],
      // 每次切换后滚动到顶部，后退时恢复原位置由下面的脚本处理
      animationSelector: '[class*="transition-"]',
    }),
  ],
  vite: {
    plugins: [
      // 把 content 目录里的静态资源映射成同名 URL（不复制文件）
      contentAssets(),
      tailwindcss(),
    ],
  },
});
