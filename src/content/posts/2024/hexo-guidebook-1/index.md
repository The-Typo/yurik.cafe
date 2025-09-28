---
title: "使用 Hexo 搭建静态博客"
published: 2024-02-18 02:33:21
description: ''
image: 'banner.png'
tags: ['Hexo',博客,建站]
category: '技术'
draft: false 
lang: ''
---

# 前言

想到年，我曾经写过「[使用 Hugo 搭建个人博客](/2022/hugo-blog/)」一文，现在又来转投 Hexo 的怀抱了。

# Hexo 是什么

Hexo 是一款基于 Node.js 的静态博客框架，它具有轻量、快速、简洁且高效的特点。它可以将 Markdown 语法转换为
HTML，方便用户编写博客文档。Hexo 支持使用 node 命令进行一键部署到 GitHub Pages、Heroku 或其他平台，非常适合个人博客的搭建。此外，Hexo
还具有丰富的插件和主题，可以满足用户的不同需求。

# 安装 Hexo

## 安装 Node.js

Hexo 依赖于 Node.js 环境，因此确保你的计算机已经安装了 Node.js 和 npm (同时你也可以使用 yarn 来管理你的 Node.js 包)

## 安装 Hexo 命令行工具

hexo-cli 是 Hexo 官方的命令行管理工具，它提供了快速新建、发布、部署博客等功能。

你可以通过 npm（或 yarn，下文不再赘述）安装 hexo-cli

在终端中执行以下命令来安装 hexo-cli

```bash
# npm
npm install hexo-cli -g

# yarn
yarn global add hexo-cli
```

> 我们将提供 npm 和 yarn 的命令，请根据你的情况选择
> 下同

# 初始化 Hexo

## 生成站点目录

接下来，你需要创建一个新的 Hexo 博客项目。在终端或命令提示符中，导航到你想要创建博客的目录，然后运行以下命令：

```bash
hexo init folder
```

其中 folder 改为目标文件夹名称（下同），如果在当前文件夹初始化的话就执行以下命令:

```bash
hexo init .
```

此时目标文件夹中会生成以下文件

```txt
.
│  .gitignore              # git提交时的省略文件
│  package.json            # Node.js项目描述和依赖管理文件
│  _config.landscape.yml   # Hexo 初始主题 Landscape 的配置文件
│  _config.yml             # Hexo 站点配置文件
│
├─scaffolds                # Hexo生成文章时的结构模板
│      draft.md
│      page.md
│      post.md
├─source                   # Hexo站点源文件
│  └─_posts                # 博文文件夹
│          hello-world.md
├─themes                   # 主题文件夹
│       .gitkeep           # 告诉git要保留这个空文件夹
│
├─node_modules             # Node.js 依赖包存放
│
└─.github                  # 使用Github来自动部署Hexo的配置文件
```

## 安装依赖包

### 进入站点文件夹

```bash
cd folder
```

### 使用包管理器安装 Node.js 依赖包

```bash
# npm
npm i

#yarn
yarn
```

# 配置 Hexo

## \_config.yml 配置

进入你创建的博客文件夹，你将看到一个名为\_config.yml 的文件，这是 Hexo 的配置文件。你可以根据自己的需求修改该文件，例如设置博客标题、域名、文章路径等。

参数详解请参考[Hexo 官方文档](//hexo.io/zh-cn/docs/configuration)

## package.json 配置

`package.json` 是 Node.js 项目描述和依赖管理文件，你可以在 `package.json` 中添加以下内容

```json
{
  "scripts": {
    "g": "hexo cl && hexo g",
    "cl": "hexo clean",
    "d": "hexo deploy",
    "s": "hexo cl && hexo g && hexo s"
  }
}
```

这样使用以下语句就可以逐条执行 `清理静态文件->生成静态文件->部署开发服务器`三个过程

```shell
# npm
npm run s

# yarn
yarn s
```

# 创建文章

在站点根目录使用终端，执行以下命令:

```shell
hexo new post <your-post-name>
```

其中 `<your-post-name>`修改为你的文章名称（英文）

之后在`source\_posts\<你的自定义路径>\`中将会生成`<your-post-name>.md`文件，使用 Markdown 语法编辑即可开始写作

# 渲染 HTML 文档

若你已经按照[上文](#package-json-%E9%85%8D%E7%BD%AE)配置了`package.json`文件，你可以执行以下命令来生成静态 HTML 文档

```shell
# npm
npm run g

# yarn
yarn g
```

当然你也可以手动执行 Hexo 命令来逐步生成

```shell
# 清理原public文件(必须)
hexo clear       # hexo cl

# 生成静态文档
hexo generate    # hexo g
```

生成的静态文档将出现在目录下`public`文件夹中，你可以将它上传至你的网页服务器或者 gh-pages 等 serverless 服务中

# 推荐配置

## 开启文章资源文件夹

Hexo 默认不开启文章资源文件夹，所有的图片都直接读取`source`文件夹中的非`_`开头目录中文件，这并不方便图片管理。

你可以在`_config.yml`中将`post_asset_folder`设置为`true`

```yml
post_asset_folder: true
```

当在 `post_asset_folder` 为 `true` 时，Hexo 会在你创建新文章时自动生成一个与文章同名的文件夹。

在 Markdown 文件中引用图片时，你可以使用相对路径来指向这个文件夹中的图片文件。例如，如果你有一张名为 `image.jpg` 的图片放在
`my-article` 文件夹中，你可以在 `my-article.md` 文件中使用 `![](image.jpg)` 的语法来引用这张图片。

通过使用 `post_asset_folder` 功能，你可以更好地组织和管理 Hexo 博客中的文章和资源，提高写作和发布的效率。

<div class="alert alert-danger" role="alert">
  如果你要配置封面时不可以使用上文提及的相对路径，而是应该使用相对站点根目录的路径，如<code>/my-article/image.jpg</code>
</div>

## 配置文章存储路径

Hexo 默认将所有文章全部存放在`source\_posts`下，这并不利于按时间管理文章

你可以在`_config.yml`中修改`new_post_name`设置来设置文章存放路径

```yml
new_post_name: :year/:month/:title.md
```

相关变量请参考[Hexo 官方文档](//hexo.io/zh-cn/docs/permalinks)

# 主题

你可以为自己的 Hexo 站点安装不同的主题，具体主题配置请参考相关主题文档

[Hexo 主题列表](//hexo.io/themes/)

# Enjoy Your Writing

:D
