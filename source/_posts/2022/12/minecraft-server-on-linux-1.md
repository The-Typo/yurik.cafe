---
title: "「技术」在Linux上搭建MC服务器（一）"
cover: /2022/minecraft-server-on-linux-1/done.png
date: 2022-12-14
tags:
categories: 技术
---

接上文

自从有了一台独立服务器后，可以玩的东西就多了

于是决定开一个我的世界 Java 服务器

写一篇文章记录一下

## 安装运行环境

Minecraft Java 版的服务器运行环境非常单纯，只需要一个 Java 就行

由于我想开一个 1.16.5 的服务器，所以 Java 版本选择了 Java 17

安装过程参考的这篇文章《[Linux 安装 Java 17 - ChaosMoor](https://www.cnblogs.com/chaosmoor/p/15897693.html)》

## 下载服务端

Minecraft 服务端有很多种，例如原版香草端(Vanilla)、Paper、Bukkit 等

由于我希望保留原版的红石特性，所以选择了原版服务端

对于最新版本的 Minecraft 服务器，可以前往[Minecraft.net](https://www.minecraft.net/download/server)下载 jar 文件

如果你想获取特定版本的服务端文件，可以访问[Minecraft Wiki](https://minecraft.fandom.com/wiki/Minecraft_Wiki)搜索对应版本页面

![1.16.5 - WIKI](wiki.png)

▲ Wiki 界面

Download(下载) -> Server(服务端)下载服务端

> <span style="color:red !important"><b>注意，不开玩笑！</b></span>：千万不要误点括号后的(.json)文件，或错选 Obfuscation maps(混淆映射表)中的 Server(服务器)选项

## 运行服务器

进入终端

在服务器上新建一个文件夹存放服务端文件

`mkdir <文件夹名称>`

进入文件夹

`cd <刚才的文件夹名称>`

将下载好的服务端文件上传至该文件夹

![WinSCP](winscp-upload.png)

▲ 使用 WinSCP 上传

> 我在这里将服务端命名为 server.jar

修改文件权限

`chmod 744 <服务端文件名>.jar`

然后运行服务器！

`java -Xmx1024M -Xms1024M -jar <服务端文件名>.jar nogui`

![Waring-1](waring-1.png)

▲ 终端报错了

怎么回事，闪退啦?

查了下翻译软件，发现是要你同意 Eula 文件

做法很简单

用文本编辑器将 eula.txt 中最后一行`eula=false`修改为`eula=true`再次运行即可

![Accept EULA](eula-true.png)

▲ EULA.TXT 修改后

> <span style="color:green !important"><b>记住这点更好</b></span>：当你将 eula 改为**true**后，即代表你同意了《[MINECRAFT 最终用户许可协议](https://account.mojang.com/documents/minecraft_eula)》, 因此你最好详细阅读一下

## 服务器配置

无论是什么客户端，**server.properties**是必须的配置文件，当然，在第一次运行服务端时会自动生成，文件内容 + 必要注释 请查看[这个网址](https://wiki.yurik.cafe/Game/Minecraft/Server/server.properties/)

可以对应自己实际情况修改，也可以下载[我的配置文件](server.properties)（基本默认）

## 成功

![Done](done.png)

▲ 游戏内的显示效果

## 管理服务器

你可以使用命令行来管理服务器，常用的命令有：

- `stop`：停止服务器
- `list`：列出当前在线的玩家
- `kick [player]`：将玩家踢出服务器
- `ban [player]`：封禁玩家
- `op [player]`：将玩家提升为服务器管理员
- `whitelist add [player]`：将玩家添加到白名单
