# TradeTalk：朗读、PWA 和 Vercel 部署

当前版本已内置 184 条话术，并安装 vite-plugin-pwa 与 workbox-window。

## 1. 试听英语朗读

在项目目录执行：

```powershell
npm.cmd run dev
```

如果之前的开发服务仍在运行，先在对应终端按 Ctrl+C，再重新启动。
打开终端给出的本地网址，卡片上方可选择美音或英音，点击小喇叭朗读英文原句。
再次点击可停止；换卡或离开学习页会停止朗读。按钮独立于卡片展开按钮。

语音使用 SpeechSynthesis，优先选择所选口音的本地英语音色；缺少该口音时尝试另一种英语口音并提示。
设备只有非英语音色时会提示添加英语语音。首次音色列表尚未加载时，用 en-US 或 en-GB 请求系统音色。
实际音色由设备和浏览器提供，不能由前端安装统一的声音；部分在线音色需要网络。

## 2. 验证 PWA 构建

```powershell
npm.cmd run build
npm.cmd run preview
```

打开终端给出的 Local 地址，通常为 http://localhost:4173。
首次联网加载后，会提示“已支持离线学习”。之后可测试断网刷新和切换卡片。
开发服务不启用 Service Worker；离线与安装测试应使用生产预览或 HTTPS 部署。

- 构建自动生成 dist/manifest.json、dist/sw.js 和 Workbox 脚本。
- App 名称为 TradeTalk，主题色为 #115e59，启动模式为 standalone。
- public/ 提供 192、512、maskable 和 Apple Touch 图标。
- 新版本就绪时显示更新提示，点击“更新应用”才刷新，以便先保存表单。

## 3. 从本机部署到 Vercel

无需先创建 GitHub 仓库。在此项目目录执行：

```powershell
npx.cmd vercel@latest login
npx.cmd vercel@latest --prod
```

按终端指引在浏览器完成 Vercel 登录。首次部署时：

1. 确认设置并部署当前目录。
2. 选择你的个人账号或有权限的团队。
3. 若没有现成项目，选择创建新项目。
4. 输入项目名称，例如 tradetalk-learning。
5. 代码目录填 ./，框架为 Vite。
6. 构建命令 npm run build，输出目录 dist，安装命令 npm ci；vercel.json 已配置这些值。

部署成功后，打开返回的生产网址。以后在同一项目目录再次执行 npx.cmd vercel@latest --prod 即可更新。
本次代码修改未执行账号登录或远程部署。

如果使用 GitHub，也可以把源码和 package-lock.json 提交到仓库，再从 Vercel 的 New Project 导入，采用相同构建设置。
node_modules、dist 和 .vercel 已在 .gitignore 中排除，不需要提交。

Vercel Hobby 免费方案仅适用于个人非商业用途；企业使用或商业服务应选择符合用途的方案。

## 4. 安装到手机桌面

请用手机打开部署后的 HTTPS 网址，不要使用电脑的 localhost，也不要在社交应用内置浏览器中安装。

- Android：用 Chrome 打开，打开菜单，选择“安装应用”或“添加到主屏幕”。
- iPhone：用 Safari 打开，点分享，选择“添加到主屏幕”；如有“作为 Web App 打开”选项，保持开启，然后点“添加”。

从桌面图标进入后，应用以独立窗口打开，没有普通浏览器地址栏。系统状态栏是否显示由设备决定。
首次联网缓存后，卡片和词库可离线使用；离线朗读取决于设备是否提供本地英语音色。

184 条内置话术随网站提供。自行添加的话术仍只存在对应设备、浏览器和站点的 LocalStorage，电脑和手机不会自动同步。
从 localhost 换到 Vercel 域名时，原本的自定义词库不会自动迁移；旧浏览器数据仍留在原站点。

## 官方资料

- SpeechSynthesis：https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- Vite PWA React：https://vite-pwa-org.netlify.app/frameworks/react
- Vercel Vite：https://vercel.com/docs/frameworks/frontend/vite
- Vercel CLI：https://vercel.com/docs/cli/deploy
- Hobby 适用范围：https://vercel.com/docs/plans/hobby
- iPhone 主屏幕：https://support.apple.com/en-euro/guide/iphone/iph42ab2f3a7/ios
