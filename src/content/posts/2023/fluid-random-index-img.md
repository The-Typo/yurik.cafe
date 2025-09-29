---
title: "将 Fluid 主页封面修改为随机图片"
published: 2023-09-12 12:27:51
description: ''
category: '技术'
draft: false
lang: ''
---

# 前言

Fluid 是一款很好用的 Hexo 主题，但他默认的主页封面并不能做到多张图片随机。于是我决定魔改他

# 原理

通过查看 `layout/index.ejs` 文件可以看出 index_img 的定义为`index_img = post.cover || theme.post.default_cover`

我们只需要将 `theme.post.default_cover` 改为数字外加随机数取出就好了

而 ejs 支持 js 的 Math.random 语法，稍微学习 Javascript 就可以修改了

# 修改

进入 `主题文件夹/layout`，打开`index.ejs`

搜索 `theme.post.default_cover`

将其修改成 `theme.post.default_cover[Math.floor(Math.random() * (theme.post.default_cover.length))]`

修改 Fluid 的配置文件 **\_config.fluid.yml**

将 **default_index_img** 配置项修改为这样

```yml
default_index_img:
  - 此处为图片链接
  - 此处为图片链接
```

重新部署就好啦！

# 后记

我同时也修改了 Fluid 的封面命名规则，这样子只需要设置一次封面属性就可以同时应用到 index_img 和 banner_img 啦

~~我也将修改后的主题改名为 Farbic 开源在 Github 仓库中 **Rabbit-Clan/hexo-theme-farbic**，欢迎 Star + Fork~~

~~Farbic 主题还重新修改了部分页面的配置方式，使配置方式更加直观~~

~~只是还没来得及编写文档，可能安装后会出现无法使用的情况~~

2023.09.14 : 由于技术原因，暂时不单独提供修改的主题，您可以前往本博客仓库自行克隆后提取

**修改后的主题仍遵循 GPL 协议公开。**
