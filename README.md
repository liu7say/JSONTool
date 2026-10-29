# JSONTool (Chrome/Edge Extension)

[简体中文](README.md) | [English](README_EN.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Vue](https://img.shields.io/badge/Vue-3.x-42b883.svg) ![Style](https://img.shields.io/badge/Style-Fluent%202-0078d4.svg) ![Version](https://img.shields.io/badge/version-v0.8.0-blue.svg)

> 个人自用扩展，欢迎提交 Issue。

JSONTool 是一款本地运行的 Chrome/Edge 浏览器扩展，用于 JSON 数据的格式化、验证、表格展示与版本对比。界面基于 Fluent 2 设计规范构建。

所有数据均保存在浏览器存储（`chrome.storage.local`）。

## 功能特性

### 界面与交互

- 遵循 Fluent 2 设计规范，支持深色与浅色模式。
- 标签栏支持多标签管理、右键上下文菜单（关闭、关闭其他、关闭下方、复制副本、重命名）、鼠标中键快速关闭及滚动平滑遮罩。
- 自动保持工作区多标签会话，重新打开浏览器自动恢复。

### 编辑器与格式化

- 基于 CodeMirror 6，提供语法高亮、代码折叠与正则搜索替换。
- 支持标准 JSON 与 JS Object 模式（支持无引号键名等宽松语法解析）。
- 支持一键格式化（Format）、紧凑压缩（Compact）与对象键名递归排序（Sort）。
- 提供“格式自动检测”开关，避免输入过程中频繁阻断。
- 独立保持每个标签页的代码折叠状态。

### 表格视图

- 支持将顶层或指定路径的 JSON 数组直接转换为交互式数据表格。
- 支持列宽拖拽调整、表头多维排序与全文关键词即时筛选。

### 差异对比 (Diff Mode)

- 双栏实时对比（Side-by-side），精确高亮差异内容。
- 对比侧支持独立的格式化与紧凑操作。

### 国际化 (i18n)

- 内置中文与英文语言界面，支持自动检测与手动切换。

## 技术选型

- **核心框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **代码编辑器**: CodeMirror 6 (@codemirror/lang-json, @codemirror/merge)
- **样式系统**: 自定义 Fluent 2 SCSS
- **构建工具**: Vite + @crxjs/vite-plugin

## 目录结构

```
src/
├── stores/          # 状态管理 (Session, Theme, Settings)
├── domain/          # 领域模型 (Document Model)
├── features/        # 功能模块 (CodeMirror 扩展, JSON 解析/排序/表格, 差异对比)
├── components/      # Vue 组件 (编辑器, UI 控件)
├── services/        # 浏览器存储与底层服务
└── styles/          # Fluent 2 样式规范实现
```

## 开发与构建

### 环境要求

- Node.js >= 16
- npm / pnpm

### 常用命令

```bash
# 1. 安装依赖
npm install

# 2. 开发模式 (支持热更新)
npm run dev

# 3. 生产环境构建
npm run build
```

## 扩展安装

1. 在 Chromium 内核浏览器中打开扩展管理页面 (`chrome://extensions/` 或 `edge://extensions/`)。
2. 开启右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择项目构建输出的 `dist/` 目录。
4. 或从 Releases 下载预打包好的压缩包 (`JSONTool-ChromeWebStore-v0.8.0.zip`) 解压载入。
