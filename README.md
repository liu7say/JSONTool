# JSONTool (Chrome/Edge Extension)

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Vue](https://img.shields.io/badge/Vue-3.x-42b883.svg) ![Style](https://img.shields.io/badge/Style-Fluent%202-0078d4.svg)

> 本扩展纯 AI 开发,个人自用,有问题请提交 issue,我也不一定会看 😂

> 感谢谷歌大善人

JSONTool 是一款专为开发者打造的**本地化** JSON 调试利器。它拒绝花原本能，忠实遵循微软 **Fluent 2 设计语言**，为您提供原生 Windows 11 般的流畅体验。

> **我们信仰 "Privacy First"**：所有数据处理均在本地 (`chrome.storage.local`) 完成，绝无任何网络上传，安全是我们的底线。

## ✨ 核心特性

### 🎨 极致的 Fluent 2 体验

- **沉浸视觉**：自研 UI 库像素级还原亚克力 (Acrylic) 与云母 (Mica) 材质，支持亮色/暗色主题无缝切换。
- **原生交互**：
  - SVG 图标与微动效，细节打磨至像素级。
  - 标签栏支持**鼠标中键关闭**、平滑滚动及边缘渐变遮罩，多文件管理得心应手。
  - 支持 **Ctrl+S** (或 Cmd+S) 快捷键快速保存快照，原生体验一气呵成。

### 🛠️ 强大的数据工场

- **现代化编辑器**：基于 **CodeMirror 6**，提供毫秒级响应的语法高亮、代码折叠与正则搜索。
- **智能格式化**：
  - **Format / Compact**：一键美化或极致压缩，容错解析让糟糕的数据也能被拯救。
  - **Sort**：支持对象键值递归排序，加载动画丝滑无感。

### 📊 超级表格视图 (Table View)

将复杂的 JSON 数组转化为可交互的电子表格：

- **拖拽列宽**：按需调整，查看长数据不再受限。
- **即时过滤**：支持全文关键词检索，秒级定位目标行。
- **多维排序**：点击表头即可升/降序排列，数据规律一目了然。

### ⚖️ 差异对比 (Diff Mode)

- **双栏视图**：Side-by-side 实时展示差异，依托高效算法精准高亮变更。
- **独立操作**：对比侧（右侧）支持独立格式化与压缩，方便处理原始脏数据。

### 💾 时光机 (History)

- **自动快照**：关键操作自动留痕，不再因为手滑丢失代码。
- **本地回溯**：历史记录持久化存储，随时找回昨天的灵感。

## 🛠️ 技术栈

本项目拒绝臃肿，采用前沿且轻量的技术栈构建：

- **核心框架**: [Vue 3](https://vuejs.org/) (Composition API) - 响应式的基石。
- **状态管理**: [Pinia](https://pinia.vuejs.org/) - 简洁直观的状态流。
- **UI 系统**: **自研 Fluent 2 SCSS 库** - 完全移除 Element Plus 依赖，极致轻量。
- **编辑器**: [CodeMirror 6](https://codemirror.net/) - 强大且可扩展的代码核心。
- **构建工具**: [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) - 极速开发体验。

## 📂 项目结构

```
src/
├── stores/          # 状态管理 (Session, History, Theme)
├── domain/          # 核心业务逻辑 (Document Model)
├── features/        # 功能模块 (CodeMirror Extensions, JSON Ops, Diff)
├── components/      # Vue 组件 (Editor, UI Controls)
├── services/        # 基础设施 (Chrome Storage)
└── styles/          # Fluent 2 样式系统 (SCSS Variables, Mixins)
```

## 🚀 快速开始

### 环境准备

- Node.js >= 16
- npm / pnpm

### 安装与构建

```bash
# 1. 安装依赖
npm install

# 2. 开发模式 (热更新支持)
npm run dev
# 访问 http://localhost:5173 或加载 dist/ 到浏览器

# 3. 生产构建
npm run build
```

## 💿 安装载入

1. 浏览器打开扩展管理页 (`chrome://extensions/` 或 `edge://extensions/`)。
2. 开启右上角的 **"开发者模式"**。
3. 点击 **"加载已解压的扩展程序"**，选择本项目生成的 `dist/` 目录。

---

## TODO

- [x] 标签栏添加展开和收缩按钮
- [ ] 看看是否需要将"JSON Tool"(只处理 json)修改为"Dev Tool"(增加如字符串、URL 等数据的处理)
