# XBBDYF · 个人博客

一个纯静态的个人创作日志：代码、游戏 MOD 和生活手记。页面已生成，可直接部署到 GitHub Pages 或其他静态服务器；服务器不需要 Node.js、Python 或数据库。

## 本地预览

本机安装 Node.js 18 或更新版本后，在仓库根目录运行：

```powershell
node scripts/build.cjs
node scripts/check.cjs
node scripts/serve.cjs 4173
```

打开 http://127.0.0.1:4173 。`Ctrl+C` 结束预览。双击 HTML 也能阅读，但建议用本地 HTTP 预览，便于验证音视频、链接和浏览器缓存行为。

没有 npm 依赖，也不需要 npm install。构建时复用仓库已有的 Markdown 解析器，浏览器不下载它。

## 写文章

1. 在 `articles/` 新建 Markdown 文件，例如 `6.md`。
2. 在 `articles/list.json` 中增加一条记录。`id` 对应 Markdown 文件名，只用英文字母、数字、下划线、短横线。`date` 使用 `YYYY-MM-DD` 格式。
3. 运行 `node scripts/build.cjs` 和 `node scripts/check.cjs`。
4. 发布更新后的首页、文章页、订阅文件和资源。

```json
{
  "id": "6",
  "title": "新文章标题",
  "date": "2026-11-05",
  "summary": "一句简短、真实的摘要。",
  "category": "技术笔记",
  "cover": "articles/images/cover.webp"
}
```

分类可自行命名，首页自动生成分类按钮。未填写分类时，已有五篇沿用预设分类，新文章默认为“折腾记录”。文章按日期倒序排列。不填封面会显示轻量的 CSS 封面，不发起图片请求。

正文图片使用 `/articles/images/图片名.webp` 路径，构建器会转换为文章页可用的相对路径，也支持中文文件名。静态页面位于 `posts/<id>.html`，可以直接分享、刷新和收藏。

## 图片优化（可选）

仓库已有压缩后的图片与清单。新增、替换头像或图片后，可安装 Pillow 并重新生成；仅构建页面时不需要 Python：

```powershell
python -m pip install Pillow
python scripts/optimize-images.py
node scripts/build.cjs
node scripts/check.cjs
```

原图保留。封面使用最大 640×480 的等比 WebP 缩略图，GIF 只提取首帧用于封面，正文继续显示原动图。JPEG 正文转为最大宽 1280 的 WebP。已足够小的 WebP 会复用原文件。文章图片衍生文件名包含原图内容摘要，替换图片后可自动避开旧缓存。

## 加载流程

- HTML 已包含标题、作者介绍、文章列表与正文，阅读不依赖 JavaScript 请求。
- 首屏只依赖本地样式与一个约 5.5 KB 的延迟脚本，无第三方 CDN、网络字体或图标字体。
- 封面、头像和正文图片懒加载，并预留宽高，减少加载时跳动。
- 首页不加载 Markdown 解析器、代码高亮库、粒子特效或音频。代码块保留清晰的等宽排版与复制按钮。
- 搜索与分类在本地已生成的标题、摘要、分类中完成，无接口请求；不搜索文章全文。
- 展开播放器、选择歌曲均不会下载音频，只有点击播放才开始请求。视频使用 `preload="none"`，不自动播放。
- CSS 和 JavaScript 的引用带内容版本号，重新构建后自动更新。
- 明暗主题偏好本地保存，支持减少动态效果和打印阅读。

旧版页面、原始文章、图片、音乐、隐私页、小游戏与 AI 聊天目录均保留。贪吃蛇与俄罗斯方块暂时从现代版和复古版项目区隐藏，当前展示 PSP 音乐播放器（MELODY）。点击项目会打开群聊介绍，提供群号 1103558445 和用户提供的原始二维码；关闭 JavaScript 时跳转到 `project/psp.html`。共享项目模板在 `scripts/project-psp.cjs`，修改后分别运行两个版本的构建命令。

## 部署

生成文件已放在仓库根目录，不需要另找 dist 文件夹。GitHub Pages 可继续使用原来的发布分支和目录。其他静态主机上传根目录中的站点文件即可；不要上传 `.git`、本地测试产物或开发脚本。新增 `.nojekyll` 确保 GitHub Pages 原样发布静态资源。

至少发布以下内容：

- `index.html`、`posts/`、`feed.xml`
- `assets/`、`articles/images/`、`music/`、`project/psp.html`
- `old/`、`privacy/` 及你希望继续提供的旧工具目录

RSS 默认使用 `https://xbbdyf.github.io/`。如果部署域名或基础路径不同，构建前指定实际站点地址（末尾建议保留 `/`）：

```powershell
$env:SITE_URL = 'https://example.com/blog/'
node scripts/build.cjs
node scripts/check.cjs
```

页面导航和资源采用相对路径，支持子目录部署；此设置主要影响 RSS 中的绝对链接。修改源码 `assets/site.css`、`assets/site.js` 后也要重新构建，以更新缓存版本。

### 服务器侧建议

如果你可以管理 Nginx，可参考 `docs/nginx-static.conf` 开启 gzip 和浏览器缓存。HTML 建议每次向服务器验证，带版本号的 CSS/JS 与有内容摘要的图片可以长缓存。如果主机由平台管理，先使用平台的压缩与 CDN 选项。

页面优化减少下载量与请求依赖；若服务器的 HTML 首字节本身等待很久，还需要检查服务器线路、源站负载或 CDN。此仓库的修改没有更改远程服务器配置，也没有自动发布。

## 验证

`node scripts/check.cjs` 检查生成的首页和文章页：本地链接与锚点、图片宽高、按需媒体、静态正文、RSS 绝对链接以及 CSS/JS 版本是否匹配。

设计与维护原则见 `docs/blog-design.md`。每次更新文章后，先构建，再验证，再发布。
