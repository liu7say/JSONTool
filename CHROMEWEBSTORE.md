# Chrome Web Store Listing — JSONTool

> Last Updated: 2026-10-23

## Store Listing

**Extension Name** [REQUIRED]
JSONTool

**Short Description** [REQUIRED]
Fast JSON formatting, visual diff comparison, and interactive table view running 100% locally in your browser.

**Detailed Description (English)** [REQUIRED]
JSONTool is a fast, local-first Chrome extension for JSON formatting, visual diff comparison, and tabular data viewing. All operations execute entirely on your device. Your data never leaves your browser.

Key Features

1. Formatting and Editing
- Format, compact, and recursively sort object keys with one click.
- Support for loose JavaScript object literals, effortlessly handling unquoted keys and flexible syntax.
- Syntax highlighting, code folding, and regex-powered find and replace.
- Per-tab code folding persistence that prevents unexpected expansions during tab switching.
- Optional automatic format detection to avoid intrusive validation while typing.

2. Side-by-Side Diff Comparison
- Real-time two-pane visual diff viewer that highlights insertions, deletions, and modifications.
- Independent format and compact controls for each comparison pane.

3. Interactive Table View
- Convert root or nested JSON arrays into structured, interactive data tables.
- Drag-and-drop column resizing, multi-column sorting, and instant keyword filtering.

4. Session and Multi-Tab Management
- Multi-tab workspace with middle-click tab closure.
- Automatic session persistence that preserves open editor tabs across browser restarts.

Privacy and Security
JSONTool does not initiate network requests, does not collect analytics or personal data, and operates 100% offline. All contents are stored strictly within your browser's local storage (chrome.storage.local).


**Detailed Description (Chinese)**
JSONTool 是一款运行在浏览器本地的 JSON 格式化、文本对比与数据表格化扩展。所有数据处理均在浏览器本地完成，不依赖外部服务器，不上传任何用户数据。

主要功能

1. 格式化与编辑
- 支持标准 JSON 格式化、紧凑压缩与对象键名递归排序。
- 支持宽松 JavaScript 对象（JS Object）语法解析，自动处理无引号键名等常见格式。
- 提供代码高亮、折叠展开与正则搜索替换。
- 独立保持每个标签页的折叠展开状态，避免切换时重复重绘。
- 提供格式自动检测开关，减少输入过程中的频繁校验中断。

2. 视觉差异对比 (Diff)
- 提供双栏并排比对视图，精确定位并高亮显示两段文本的差异。
- 对比侧支持独立的格式化与压缩操作。

3. 数据表格视图 (Table View)
- 一键将顶层或指定层级的 JSON 数组转为交互式表格。
- 支持列宽自由拖拽调整、表头多维排序与全文关键词即时筛选。

4. 会话与多标签管理
- 支持多标签页并发工作与鼠标中键快速关闭。
- 自动持久化当前工作区会话，关闭浏览器后重新打开自动恢复标签内容。

隐私与安全
本扩展不包含网络请求逻辑，不收集任何用户行为，不追踪任何使用数据。所有编辑内容均保存在浏览器的本地存储 (chrome.storage.local) 中。

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
A fast and secure local tool for formatting, comparing, and viewing JSON data in your browser.

**Primary Language** [REQUIRED]
Chinese (Simplified) / English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `public/icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To be captured | Main Editor & Formatting (Dark/Light mode) |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To be captured | Side-by-Side Diff View |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To be captured | Interactive Table View |
| Screenshot 4 | 1280×800 | ⬜ To be captured | Multi-tab Workspace (Fluent 2 theme) |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To be created | Promo banner |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Used exclusively to save user editor tabs and interface preferences (theme and language) in the browser's local storage (`chrome.storage.local`). No data is ever transmitted to remote servers. |

---

## Privacy & Data Use

### Data Collection
**Does the extension collect user data?** No

JSONTool processes all JSON text locally in the browser runtime and stores workspace tabs strictly in browser local storage. No data is collected, logged, or transferred off-device.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Distribution

**Visibility**: Public
**Regions**: All regions

---

## Developer Info

**Publisher Name**: JSONTool Developer
**Support URL**: https://github.com/liu7say/JSONTool/issues
**Homepage URL**: https://github.com/liu7say/JSONTool

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.8.0 | 2026-10-23 | Initial Chrome Web Store package with Fluent 2 design, i18n, table view, and diff mode. | Draft |
