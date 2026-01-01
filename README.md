# JSONTool (Chrome/Edge Extension)

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Vue](https://img.shields.io/badge/Vue-3.x-42b883.svg) ![Style](https://img.shields.io/badge/Style-Fluent%202-0078d4.svg)

JSONTool 是一款专为开发者设计的本地 JSON 调试工具扩展。它采用了现代化的 **Fluent 2 设计语言**，提供类似原生 Windows 11 应用的流畅体验。支持多标签页编辑、语法高亮、差异对比、表格视图以及本地历史记录。

## ✨ 核心特性

- **多标签页管理**：支持同时打开多个 JSON 文档，类似 IDE 的标签页体验。
- **现代化编辑器**：基于 **CodeMirror 6**，支持语法高亮、折叠、搜索替换（支持正则）。
- **Fluent 2 设计**：
  - 遵循微软 Fluent Design System 设计规范。
  - 支持 **亮色 / 暗色** 主题自动/手动切换。
  - 亚克力（Acrylic）/ 云母（Mica）材质视觉效果。
  - 完美的 **SVG 代码折叠图标** 与悬浮搜索面板。
- **丰富的数据操作**：
  - **格式化 / 压缩**：一键美化或压缩 JSON。
  - **排序**：支持对象键自动排序。
  - **Table 视图**：将 JSON 数组转换为可交互的表格。
  - **差异对比 (Diff)**：直观展示两个 JSON 的差异。
- **数据安全**：所有数据均存储在本地 (`chrome.storage.local`)，无任何网络上传，安全可靠。
- **历史记录**：自动/手动保存快照，支持随时回溯。

## 🛠️ 技术栈

本项目使用前沿的前端技术栈构建：

- **核心框架**: [Vue 3](https://vuejs.org/) (Composition API)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **UI 系统**: 自研 Fluent 2 SCSS 样式库 (完全移除 Element Plus 依赖)
- **编辑器**: [CodeMirror 6](https://codemirror.net/)
  - 自定义 Fluent 主题 (`fluent-theme.js`)
  - 自定义折叠槽 (`fluent-fold.js`)
- **构建工具**: [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)

## 📂 项目结构

```
src/
├── stores/          # Pinia 全局状态
│   ├── session.js   # 会话管理 (Tabs)
│   ├── history.js   # 历史记录
│   └── theme.js     # 主题管理
├── domain/          # 领域模型
│   └── document.js  # JSON 文档实体
├── features/        # 核心功能模块
│   ├── codemirror/  # 编辑器扩展 (主题, 折叠, 按键绑定)
│   ├── json/        # JSON 解析与处理
│   └── diff/        # 差异对比逻辑
├── components/      # Vue 组件
│   ├── CodeEditor.vue # 核心编辑器封装
│   └── JsonEditor.vue # 业务编辑器组件
├── services/        # 基础设施服务 (Storage)
└── styles/          # Fluent 2 样式系统
    ├── fluent.scss      # 设计像元 (Colors, Typography, Radius)
    ├── components.scss  # 组件样式 (Button, Input, Card)
    └── main.scss        # 全局重置
```

## 🚀 开发与构建

### 环境准备

- Node.js >= 16
- npm / pnpm

### 安装依赖

```bash
npm install
```

### 开发模式 (热更新)

```bash
npm run dev
```

> 开发模式下，扩展会运行在 `http://localhost:5173`。你需要手动加载 `dist/` 目录到浏览器。

### 生产构建

```bash
npm run build
```

## 💿 安装载入

1. 浏览器打开扩展管理页：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. 开启右上角的 **"开发者模式"**。
3. 点击 **"加载已解压的扩展程序"**。
4. 选择项目根目录下的 `dist/` 文件夹。
5. 点击浏览器工具栏的扩展图标使用。

---

> **Note**: 本项目严格遵循 **"Never break userspace"** 原则，优先保证向后兼容性与代码的"好品味"。
