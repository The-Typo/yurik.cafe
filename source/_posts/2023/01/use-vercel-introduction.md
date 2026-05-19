---
title: 「技术」使用Vercel托管静态网页
date: 2023-01-23
tags:

cover: "/2023/use-vercel-introduction/banner.png"

categories: 技术
---

## 前言

Vercel 是一个前端页面托管服务网站，用户可以在上面托管部署多个前端框架的项目

当然，Vercel 也可以直接托管 Html 静态站点，并且 Vercel 的访问速度优于 Github Pages

![速度对比](speed-compair.png)

写这篇文章的想法来源于两个，一是之前发布的 Hugo 博客部署有一半烂尾了（懒.jpg）, 还有一点就是 Norphin 的博客在他自己自定义后使用了一张 3.04Mb 左右的背景图片，由于他使用 frp 服务+香港节点建站，使得整张图片我加载了大约 10s。于是决定教教他怎么使用 vercel 来规避一些流量损耗。

> BTW: 他的背景图是 4K 的，其实一般来说 1080p 到 2k 就差不多了，不必要上传那么大的图片的说...

## 注册 Vercel

Vercel 的注册过程很简单，你可以直接使用自己的 GitHub、GitLab、BitBucket 账户直接登录，在本文中就不再过多赘述

## 使用 Vercel

首先在 Github 或者 GitLab 账户（下文简称**你的账户**）中新建一个 Git 仓库，随后将自己的静态文件 Git 提交至仓库内

接着在 Vercel 中点击 **Add New..**，或者访问[这个网址](https://vercel.com/new)。连接你的你的账户，选择先前新建的仓库，点击 Import

设置你的**Project Name**, 如果你单纯的想要托管 Html 文档和静态资源的话 框架预设(Framework Preset)就选 **Other** 就好了

点击 部署(Deploy) 后稍等片刻, 你的项目就部署完成

## 绑定自定义域名

Vercel 会在部署项目时提供一个 **.vercel.app** 结尾的二级域名，但由于某些特殊原因，vercel.app 域名可能会无法访问，这时候你就需要一个自己的域名（域名注册方法自行使用搜索引擎搜索）

在[Dashboard](https://vercel.com/dashboard)中点击进入你刚刚部署的项目，点击上方的 Setting 进入设置页面，在左侧边栏进入**Domains(域名)**页面，在输入框中输入你想要的域名, 点击**Add**后按照提示在 DNS 中设置记录，返回域名管理页面点击**Refresh(刷新)**使其检测记录是否生效并注册 SSL 证书即可。

> 值得注意的是，如果你添加的是一个 www 或者根域名，如 www.yurik.cafe 或者 yurik.cafe，Vercel 会跳出提示询问你是选择将 www 域名重定向至根域名还是根域名重定向至 www 域名，抑或是单纯添加你输入的域名，你可以根据自身情况选择。
>
> Vercel 推荐你将 www 域名重定向至根域名

## 访问

按照**域名/路径/文件名**访问即可

> Vercel 会自动为域名注册一个免费的 SSL 证书，所以你可以使用 https 访问
