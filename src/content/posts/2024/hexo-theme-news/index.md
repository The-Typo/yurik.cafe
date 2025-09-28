---
title: "Hexo 主题 News 现已上线"
published: 2024-02-01 00:00:00
description: ''
image: 'banner.webp'
tags: ['Hexo']
category: '项目'
draft: false 
lang: ''
---

如你所见，我给博客换上了一个新主题。

与别的主题不同的是，这个主题是我从 1 开始制作的。为什么是从 1
开始？因为这个主题我参考了 [Apple 公司的 Newsroom 页面](https://www.apple.com.cn/newsroom/)，也使用了部分 Apple 的 CSS
样式表（主要是文字相关部分），因此这个主题也被我命名为**News「新闻中心」**。这篇博文是制作 **News「新闻中心」** 主题的记录。

# 灵感

最开始的想法是在给班级网站写新闻中心页面。当时给网站主页使用的 Bootstrap 5 的 Jumbotron 模板，想着设计一个和他向契合的新闻页面，突然我想到了之前看到的
Apple Newsroom 我十分喜欢，于是便用 Bootstrap 的 Card 放置了一个差不多的页面出来，这可以称为是 **News「新闻中心」** 的 **α1
** 测试版本。

> 此处因保护隐私原因不放出参考网址

之后这个站点便因为准备期考而暂停了更新，但我仍时不时的对他的样式表做一点细微的调整，直到期考结束。期考结束的这个寒假，我按照计划维护着博客，突发奇想要不把之前写的「新闻中心」改成主题吧！

**说干就干**

# 过程

我使用的是 [YO(Yeoman generators) 生成器](https://www.npmjs.com/package/yo)来创建的 Hexo 主题模板，使用的 EJS 模板语言和
CSS 样式表，具体的技术细节就不再文中赘述了。我感觉主题的开发就和使用 PHP 写程序一样，要注重代码的**“复用”**
，即模块化编程，将不同的组件单独编写，按需调用，省去了重复造轮子的麻烦。

目前，**News「新闻中心」**已经实现了以下功能：

- 基础文章的渲染
- 友情链接页面

计划实现的功能：

- 灯箱 Fancybox
- 完善配置文件
- 代码高亮

# 特性

**News「新闻中心」**具有以下特性：

- 使用了最新的 Bootstrap 5 作为框架，「新闻中心」支持其全部组件和特性

# 鸣谢

以下项目在 Newsroom 开发时提供了无可取代的帮助，特在此表达诚挚的谢意（排名不分先后）

- 设计灵感和部分 CSS 代码来自：[Apple Inc.](//apple.com.cn)

- 导航栏动画来自：[Nero978](https://nero978.top/) | [Miracal Town/mt-web](https://github.com/Miracle-Town/mt-web)

- Hexo 主题启蒙，提供了部分样式和脚本代码：[Fluid 主题](https://github.com/fluid-dev/hexo-theme-fluid)

- 默认随机封面图来自我使用的第一个博客主题：[BigCoke233/Miracles](https://github.com/BigCoke233/miracles)

# 下载地址

<div class="alert alert-danger" role="alert">
  警告：<b>News「新闻中心」</b>因个人原因无限期停止开发。
</div>

<a href="https://github.com/ImJingLan/hexo-theme-news" target="_blank" type="button" class="btn btn-outline-dark btn-lg w-100" ><i class="bi bi-github"></i>
ImJingLan/hexo-theme-news</a>
