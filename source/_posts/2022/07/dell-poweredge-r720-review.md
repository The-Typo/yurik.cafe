---
title: "「开箱」戴尔 PowerEdge R720 上手 : 年轻人的第一台家庭服务器"
cover: /2022/dell-poweredge-r720-review/photo-3.webp
date: 2022-07-30
tags:
categories: 开箱
---

假期咯，是时候折腾一些新玩意啦！

假期开始的时候在一个同学家玩（下面叫他叫兽），突然有一天他说：「再过几周我想和你研究一下怎么写网页（HTML），顺便学学怎么搭建服务器。」

「服务器嘛，你自己用一台电脑开就好了。」

但我真的想要一台服务器啊 QwQ

回到家我越想越睡不着，越想越睡不着

于是我

![发了一条说说](qzone.webp)

## 开箱

**U1S1**，这玩意是真的沉。顺丰小哥推着一个推车帮我推上来的，辛苦了 Orz

> 顺丰小哥：你买了什么啊，这么沉？

商家发的真的结实，除了泡沫外顶上还有一层防摔垫

（由于没有图，就不放了 QWQ，大家看看上面的说说吧

## iDRAC YYDS？

> 得益于戴尔强大的 iDRAC 助力，使安装系统变成了一件 **极其容易** 的事
>
> —— 景蓝 Yurik

这是我问云资后得出的初结论

**真的吗？**

这件事可能对于一台新的 Dell 服务器来说，易如反掌，但对于这样一台二手服务器，却花费了我和云资一个下午

首先，服务器需要在原先网口的基础上再连接 iDRAC 的网口（也就是两根网线）

我的解决方案是 PDD 58 元的 水星 5 口全千兆交换机

![交换机](switch.webp)

一开始，iDRAC 7 的默认地址一直无法连接(https)

重置之后 Edge 浏览器便提示

> **使用不受支持的协议**
>
> **ERR_SSL_VERSION_OR_CIPHER_MISMATCH**

无论是 Chrome Firefox 还是 Edge 即使进入 Windows 设置支持 SSL 3.0 后仍于事无补

最后解决方案是使用 Edge 的 IE 模式访问（没想到 IE 还是蛮有用的）

**2023.09.14 增添:** 将 iDRAC 7 的版本升级到最新版本即可解决该问题啦

## 点亮

既然进入的 iDRAC，我们就启动虚拟控制台吧

![控制台](idrac-1.webp)

![iDRAC-TOP](idrac-3.webp)

点击 虚拟介质->连接虚拟介质

等待连接后点 虚拟介质->映射 CD/DVD，选择 ISO 镜像，选择系统镜像

选择 下次引导->虚拟 CD/DVD/ISO

电源->系统关机后再开机（冷引导）

重启后就和正常安装系统一样了

我安装了 Proxmox Virtual Environment ( PVE ),这样可以在一台设备上跑多个系统，ALL IN ONE YYDS!

![Proxmox Virtual Environment](PVE.webp)

> 截图时候还在装着 Centos 用来跑 Rimetown 的 主要服务
>
> 后来还装了一个 OpenMediaVault 来做 Nas

## 注意

二手服务器到了之后一定要去 BIOS 里面重置一下 iDRAC 设置，并且最好不要让 iDRAC 使用 DHCP 获取 IP，自己指定一个会方便很多

## 购买服务器后的部分问题 & 可能有用的解决方案

### 风扇开机后一直全功率运行

进入 BIOS 里面的 System BIOS Settings -> System Profile Settings 里面检查一下 C1E 有没有设置成 Enabled

设置成 Enabled 后重启，说不定就好了

实在不行就只能用[dell_fans_controller (Windows 推荐)](https://github.com/cw1997/dell_fans_controller) 或者 [ipmitool (上手成本较高)](https://github.com/ipmitool/ipmitool)来手动调速了，具体方法自行百度

别忘了开启主机的 IPMI

## 配置

|  **硬件**  |       **型号**       | **数量** |
| :--------: | :------------------: | :------: |
|  **CPU**   |     E5\-2690 v2      |    2     |
|  **内存**  | DDR3 8G REG ECC 1333 |    4     |
|  **硬盘**  |        2T SAS        |    2     |
|  **网卡**  |      四千兆网口      |    1     |
| **阵列卡** |      H310 Mini       |    1     |

## 小插曲

我的配置单中是双路 750W 的电源，但是卖家发错成了双 495W 的电源了

我找完客服之后立马给我打电话联系我补发，原先的 495W 就送我了

商家真的蛮好的

但是我的博客里面就不打广告，不提店名啦

## 结语

这一套配置说不上好，只是我第一次捡服务器（洋垃圾）的尝试

谢谢你看了那么多 Orz

总的来说，戴尔的服务器还是十分优秀的，iDRAC 简直就是服务器管理的神器！

就靠他陪伴我和即将开服的[Rime Town](https://rimetown.net) 度过未来的日子啦!

话说还是期待着换 R730 或者 R740 的说...

## 晒图

![前面板外观](photo-1.webp)
![电源  先拿495W的拍一下](photo-2.webp)
![散热器特写](photo-3.webp)
![拆下挡板后的服务器内部](photo-4.webp)
