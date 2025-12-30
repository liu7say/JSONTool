# JSONTool（Chrome/Edge 扩展）

一个本地开发调试向的 JSON 工具扩展：多标签页编辑、原地格式化/压缩/排序、表格视图、历史快照、本机存储；支持明暗主题与语法高亮编辑器（CodeMirror 6）。

## 功能概览
- 多标签：顶部 Tab，`+` 新建，`x` 关闭
- 单编辑器模式：格式化/压缩/排序会直接修改当前文本（可 Ctrl+Z 撤销）
- 表格视图：当 JSON 顶层是数组时可表格化查看
- 历史记录：保存快照 / 抽屉查看 / 删除 / 清空（`chrome.storage.local`）
- 主题：亮色 / 暗色切换

## 开发与构建
```bash
npm install
npm run build
```

## 在 Edge/Chrome 加载测试
1. 打开扩展管理页：
   - Edge：`edge://extensions/`
   - Chrome：`chrome://extensions/`
2. 开启“开发者模式”
3. 选择“加载已解压的扩展程序”
4. 选择项目下的 `dist/` 目录
5. 点击扩展图标打开独立页面

## 需求与变更记录（Cursor）
所有需求/约束/决策统一记录在：`.cursor/rules/product-requirements.md`
