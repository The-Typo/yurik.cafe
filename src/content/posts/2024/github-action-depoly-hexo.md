---
title: "使用 GitHub Actions 部署 Hexo"
published: 2024-01-15 17:53:21
description: ''
image: ''
tags: []
category: '技术'
draft: false 
lang: ''
---

## 前言

最近把博客从 Vercel 迁移到了 Netlify 了，这两家都是 ServerLess 部署平台，属于完全的无痛迁移了。

无论是 Vercel 还是 Netlify，都对于应用的部署时长有限制，但相对与 Vercel 免费的每月 6000 分钟来说，Netlify 的 300
分钟就略显寒酸了。但自从去年国庆我的网站挂在 Vercel 被墙外加最近 Vercel 访问不畅之后我就在研究 Netlify 了。

因为直接上传 NPM 包到 Netlify 上部署相比上传静态的 HTML 页面更耗时间，而我最近学习了 Github Actions，Github Actions 提供了每月
3000 分钟的部署时长，因此决定使用 Github Actions 来构建静态页面，之后仅同步静态页面到 Netlify 就完成了。

## 教程

首先在仓库中新建一个 deploy 分支用于存放构建完成的静态页面。

别忘了在 **Setting - Actions - General - Workflow permissions** 中将权限设置为 `Read and write permissions`

在仓库主分支下的`.github/workflows/`文件夹新建一个 yml 文件，名称随意，如`deploy.yml`

随后在 yml 文件下写入以下代码

```yml
name: 部署静态页面到 Deploy 分支

on:
  push:
    branches:
      - main
  #手动触发
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # 获取源码
      - name: 迁出代码
        uses: actions/checkout@master

      - name: 安装node.js环境
        uses: actions/setup-node@master

      - name: 安装Hexo-cli 和 其他 node 环境
        run: |
          npm install hexo-cli -g
          npm install

      - name: 构建静态页面
        run: |
          npm run g

      - name: 你也可以在这里执行更多Linux命令
        run: |
          echo Example

      - name: 推送到 deploy 分支 # 部署
        uses: JamesIves/github-pages-deploy-action@v4.3.3
        with:
          branch: deploy # 部署后提交到的分支
          folder: public # 打包好的目录名称
```

最后 Push 到 Github 就好啦

别忘了把 Netlify 中的链接仓库重新绑定到 deploy 分支噢
