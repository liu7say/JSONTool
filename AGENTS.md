# Repository Guidelines

## 项目结构

JSONTool 是基于 Vue 3、Pinia 和 CodeMirror 6 的 Chrome／Edge 扩展。页面入口是 `src/main.js`，扩展清单和后台脚本是 `src/manifest.json`、`src/background.js`。通用组件放在 `src/components/`，业务视图放在 `src/view/`。JSON、URL 和差异处理放在 `src/features/`，数据模型、状态和存储分别放在 `src/domain/`、`src/stores/`、`src/services/`。扩展图标在 `public/icons/`，文档截图在 `screenshots/`。

## 构建与本地开发

使用 Node.js 20.19+（20.x）或 22.12+。

- `npm ci` 按锁文件安装依赖。
- `npm run dev` 启动 Vite 热更新服务，默认端口为 5173。
- `npm run build` 生成生产扩展到 `dist/`。
- `npm run preview` 启动生产构建的网页预览。

验证扩展功能时，在 `chrome://extensions/` 或 `edge://extensions/` 开启开发者模式，选择「加载已解压的扩展程序」并指向 `dist/`。重新构建后，在扩展管理页重新加载。

## 编码与命名

Vue 组件使用 Composition API 和 `<script setup>`。沿用现有 JS、Vue 和 SCSS 文件的 Tab 缩进。JS 使用分号和单引号。组件文件名用 PascalCase（如 `ContentView.vue`），函数和变量用 camelCase。为关键逻辑添加简短中文注释。复用 `src/styles/` 的 Fluent 2 样式，在 `src/i18n/index.js` 同时补齐中英文文案。仓库暂无独立 lint 或格式化命令。

## 测试

仓库暂无自动化测试框架或覆盖率门槛。用 `src/assets/test*.json` 手动测试，补充无效 JSON 和宽松对象语法输入。修改编辑器逻辑时，验证格式化、压缩、排序、表格和差异对比中受影响的操作。修改存储时，用已有数据验证重新加载后的会话恢复。

## 提交与拉取请求

沿用历史中的 `feat:`、`fix:`、`refactor:`、`docs:` 等前缀，必要时加模块名，例如 `fix(sidebar): 修复右键菜单遮挡`。PR 写明改动原因、验证步骤和结果，有关联 Issue 时附链接。界面改动附截图，功能变化同步更新 `README.md` 和 `README_EN.md`。
