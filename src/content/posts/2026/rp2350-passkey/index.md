---
title: 40 元自制开源版 Yubikey (支持 FIDO2 和 OpenPGP 的安全密钥)
date: 2026-07-04 01:55:00 +0800
description: '本来想趁着假期去德国游学的机会去德亚采购一个 Yubikey 5 的，奈何全新价格确实有些高，从德亚买还不能保证是最新的固件版本，有被解密的风险，在高价格和安全性都不能保障下不如自己 DIY 一个支持 FIDO2 的密钥。查了一些资料后发现主流的方案都是使用 RP2350 来实现密钥，网上的别的文章都有些过时了，于是在踩了一些坑后决定写一篇文章来记录一下制作过程。'
tags: ["安全密钥","单片机","Raspberry Pi","RP2350","Yubikey","FIDO2","OpenPGP"]
categories: '技术'
draft: false 
lang: ''
---

## 前言

最近和扫扫([@Ray-Powered](https://github.com/Ray-Powered))交换了 OpenPGP 公钥，就开始研究怎么安全的保存密钥。

本来想趁着假期去德国游学的机会去德亚采购一个 Yubikey 5 的，奈何全新价格确实有些高，从德亚买还不能保证是最新的固件版本，有被解密的风险，在高价格和安全性都不能保障下不如自己 DIY 一个支持 FIDO2 的密钥。

查了一些资料后发现主流的方案都是使用 RP2350 来实现密钥，网上的别的文章都有些过时了，于是在踩了一些坑后决定写一篇文章来记录一下制作过程。

## 材料

我选择了微雪的 RP2350-One

![RP2350 One](rp2350-passkey-1.webp)

## 安装与配置

网上别的关于使用 RP2350 制作 Yubikey 的文章都不约而同地指向了一个名叫 [PicoKeys](https://github.com/polhenarejos/pico-fido) 的项目。

可在我进入他的项目主页后发现，在最近的一次更新中 PickKeys 移除了免费的 Pico Commissioner 配置工具，转而推出了收费的 [PicoKey App](https://www.picokey.com/)。

而最新的同时支持 FIDO2 和 OpenPGP 的 Pico-Fido2 固件则必须要使用 PicoKey App 来烧录和配置。这无疑是不可接受的。

在开源社区搜寻之后，我找到了 [LibreKeys](https://github.com/librekeys) 这个项目，他是基于 Pico-Fido 的开源社区维护版。同时也推出了自家的开源的 PicoForge 管理工具。

那么我们的固件烧录工具就可以开始了。

  1. 下载固件: **[Librekeys/Pico-Fido-Firmwares](https://github.com/librekeys/pico-fido-firmwares/releases)**、管理工具 **[Librekeys/PicoForge](https://github.com/librekeys/picoforge/releases/latest)** 和 Yubikey 管理工具 **[Yubico Authenticator](https://www.yubico.com/products/yubico-authenticator/)**。我选择的是为这块微雪 RP2350 One 特化的支持 EdDSA 的固件: **pico-fido2-waveshare_rp2350_one-eddsa.uf2**
  > 注意:在选择固件时选择 **picofido2** 开头的固件。
  > 不然会误下成 Pico Fido 或者 Pico OpenPGP 的独立固件。
  
  2. 安装 **PicoForge**

  3. 给 RP2350 烧录固件: 按住 RP2350 上的 **BOOT** 按钮，将其连接到电脑，电脑会将 RP2350 自动识别为一个可移动磁盘，将下载好的 **.uf2** 结尾的固件直接复制到 RP2350 上，复制完成后 RP2350 将会自动重启。

  ![RP2350 目录结构](rp2350-passkey-3.webp)

  4. 打开 PicoForge 或者点击 PicoForge 左侧栏下的 **Refresh** 按钮，此时若识别到设备则代表烧录成功。

  ![PicoForge 识别到设备](rp2350-passkey-4.webp)

  5. 点击左侧栏的 **Configuration** 进入配置界面，配置如下:
      - Identity
        - Vendor Present: `Yubikey 5`
        - Vendor ID / Product ID : `1050 / 0407` （一般选择 Vendor Present 后会自动填写）
        - Product Name: `Yubico Yubikey` （最好使用这个，使得 RP2350 伪装成一个 Yubikey 设备）
      - LED Settings
        - LED GPIO Pin : 对于这一块 RP2350 One 来说是 `16`，如果是其他的板子请参考手册。
        - LED Driver : `WS2812 (Neopixel)` 
        - Brightness (0-15) : `1` （或者你希望的亮度，0 为关）
        - LED Dimmable: `不启用` （暂时没发现用处）
        - LED Steady Mode : `不启用`  （LED运行时候是否常亮，否则则是闪烁）
      - Touch & Timing
        - Touch Timeout: `15` （安全密钥触摸超时，`0` 时代表不需要触摸安全密钥，单位：秒）
      - Device Options
        - Power Cycle On Reset: `启用` （按下 **Reset** 按钮后重启 RP2350）
        - Enable Secp256k1: `关闭` （关闭 Secp256k1 算法以提高安全性，开启后该安全密钥将不能安卓设备使用）

  ![配置Picokeys](rp2350-passkey-5.webp)

  6. 点击 **Apply Changes**，等待页面提示 **Configuration applied successfully** 。打开 **Yubico 
  Authenticator** 发现已经将我们的 RP2350 识别为一个 Yubikey 设备。

  ![Yubico Authenticator 识别到设备](rp2350-passkey-6.webp)

  7. 进入**通行密钥**页面，点击左侧的**设置 PIN** ，设置好通行密钥 PIN 后即刻将其作为实体通行密钥。

  <blockquote style="border-left: 3px solid #d42517;">
    <p><strong style="color:#AB3B3A">警告：</strong>请务必牢记设置的 PIN，默认情况下 PIN 只能尝试 8 次，每尝试 3 次会临时锁定密钥, 需要重新插拔后才能继续尝试, 总计试满 8 次后密钥永久被锁定, 此时只能并丢失所有存储的密钥。</p>
  </blockquote>

  ![设置通行密钥 PIN](rp2350-passkey-7.webp)

## 使用教程

### 用作通行密钥（以 Windows 与 WebAuthn.io 为例）

#### 注册

当我们访问支持通行密钥登陆的站点，我们可以前往账号设置中配置通行密钥。

  1. 当我们启动通行密钥注册流程后，会弹出一个对话框，询问我们将保存通行密钥的位置，我们选择实体的通行密钥。
  ![注册通行密钥](tutorial/passkey-1.webp)

  > [WebAuthn.io](https://webauthn.io/) 是一个允许用户测试 WebAuthn 与通行密钥的网站，我们可以使用它来测试通行密钥是否正常。

  2. 输入你的通行密钥 PIN
  ![输入通行密钥 PIN](tutorial/passkey-2.webp)

  3. 如果你在上文配置了 `Touch Timeout`，你需要在超时前按下 RP2350 上的 **BOOT** 按钮
  ![按下 BOOT 按钮](tutorial/passkey-3.webp)

  4. 若站点提示添加成功，说明通行密钥注册成功，你以后就可以使用通行密钥登录。

#### 登录

当我们需要登录时，只需要在登录页面选择通行密钥登录。

  1. 选择实体通行密钥并输入 PIN 码（通常能够自动选择）。
  ![登录通行密钥](tutorial/passkey-4.webp)

  2. 如果你在上文配置了 `Touch Timeout`，你需要在超时前按下 RP2350 上的 **BOOT** 按钮。
  ![按下 BOOT 按钮](tutorial/passkey-5.webp)

  3. 若你先前已经注册通行密钥，此时通常能登录成功。

  > 有的网站是在登陆页面直接点击通行密钥登录，随后如果你有多用户则会让你选择需要登录的用户完成自动登录。
  > 还有的网站是等待你输入用户名后让你提供对应用户的通行密钥完成登录。

### 用作 OpenPGP 智能卡

让我们回到开头，我使用 RP2350 就是为了当作我的实体 OpenPGP 密钥的，因此下面是 OpenPGP 相关的教程。

需要注意：scdaemon（智能卡守护进程）与 Yubico Authenticator 不能同时运行，你需要关闭 Yubico Authenticator 后重新插拔 密钥或者按下 RESET 重启后才能正常读取智能卡。

在 Windows 上我安装了 [OpenSC](https://github.com/OpenSC/OpenSC/releases/tag/latest) 服务。

我使用 Kleopatra 并来管理子密钥与智能卡，已经提前创建好了分别用于**验证**、**签名**与**加密**的密钥，由于上文刷入的固件支持 EdDSA 算法，因此我使用 Ed25519 与 Cv25519 算法生成密钥。

  1. 启动 **Kleopatra** 后点击“智能卡”，如果出现了智能卡信息则代表智能卡正常工作。
  ![智能卡信息](tutorial/openpgp-1.webp)
  
  2. 点击 **卡片操作**，分别点击 “更改 PIN”, "更改管理员 PIN" 和 “修改解锁码”。
      - 默认 PIN: `123456`，用来在使用时解锁智能卡；
      - 默认管理员 PIN: `12345678`，用来在编辑时（添加，替换密钥等）解锁智能卡；
      - 解锁码: 当你多次输入错误 PIN 与管理员 PIN 后，你可以输入解锁码来解锁智能卡。

  3. 进入私钥管理界面，右键在机器上的子密钥，选择 **“转移到智能卡”**。随后输入一次密钥短语和两次管理员 PIN 即可将密钥转移至智能卡。
  ![将密钥转移到智能卡](tutorial/openpgp-3.webp)

  4. 之后选择 **“删除磁盘上的副本”**，即可保证密钥仅存在于智能卡中。
  ![删除磁盘上的副本](tutorial/openpgp-4.webp)
 
  5. 重新进入**智能卡**页面，如果看见已经配置好的密钥则代表转移成功
  ![转移成功](tutorial/openpgp-5.webp)

完成后可以使用 **Kleopatra** 的**记事本**功能来测试智能卡是否正常工作。

接下来只需要在需要私钥时将智能卡（RP2350）插入计算机就好啦。

## 销毁/重烧

如果你不再使用这个安全密钥，或者想重新刷入固件，你需要先刷入[Pico-Universal-Flash-Nuke](https://github.com/polhenarejos/pico-universal-flash-nuke/releases/latest)，烧录方法和刷入正常固件一样，这个固件会将数据清除后重新以烧录模式启动。

## 参考

[在 Windows 中使用 Yubikey 的 OpenPGP 应用](https://blog.dejavu.moe/posts/yubikey-openpgp-on-windows)
[超便宜的物理密钥 开源版的YubiKey](https://blog.zinc233.top/blog/pico-key)
[30 元低成本自制开源版 Yubikey (支持 FIDO2 的硬件安全密钥)](https://blog.lyc8503.net/post/diy-fido-key/)
