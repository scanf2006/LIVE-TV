---
description: 如何将本 IPTV 项目打包成适用于 Fire TV 的 APK 安装包
---

# 📦 APK 打包流程指引

由于本项目是基于 Next.js 的高级 PWA (Progressive Web App)，最推荐的打包方式是使用 **TWA (Trusted Web Activity)** 协议将其封装为原生的 Android APK。

## 方案一：使用 PWABuilder (最推荐，简单快捷)

1. **部署应用**：确保您的项目已部署到公网（如 Vercel, Netlify 或您的私有服务器），并可以通过 HTTPS 访问。
2. **访问工具**：打开 [PWABuilder.com](https://www.pwabuilder.com/)。
3. **输入 URL**：输入您的项目地址（例如 `https://your-iptv-app.vercel.app`）。
4. **生成包**：
   - 点击 "Package for Store"。
   - 选择 "Android"。
   - PWABuilder 会根据我们配置好的 `manifest.json` 自动生成 APK 签名包和项目源码。
5. **下载安装**：下载得到的 `.zip` 包中包含 `.apk` 文件。您可以将其拷贝到 Fire TV 上安装。

## 方案二：使用 Bubblewrap (开发者本地打包)

如果您需要在本地环境中构建：

1. **安装工具**：
   ```bash
   npm i -g @bubblewrap/cli
   ```
2. **初始化项目**：
   ```bash
   bubblewrap init --manifest https://your-domain.com/manifest.json
   ```
3. **构建 APK**：
   ```bash
   bubblewrap build
   ```

## ⚠️ 注意事项 (针对 Fire TV)

- **横屏模式**：我们已在 `manifest.json` 中配置了全屏。
- **签名**：Fire TV 安装第三方 APK 需要在电视设置中开启“允许来自未知来源的应用”。
- **版本号**：在 `manifest.json` 或 `package.json` 中修改版本号后，重新打包即可更新电视上的应用。

## 🎨 打包资源校验
- **图标**：已部署 512x512 高清枫叶图标 (`/public/icons/icon-512x512.png`)。
- **全屏**：`manifest.json` 已设置为 `display: fullscreen`。
