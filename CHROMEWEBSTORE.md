Chrome Web Store 商店上架信息 (JSONTool)

============================================================
第一部分：中文资料 (Chinese Store Listing)
============================================================

【扩展名称】
JSONTool

【简短说明 (最多 132 个字符)】
运行在浏览器本地的 JSON 格式化、文本对比与表格化工具，无网络请求，保护数据隐私。

【详细说明 (可直接复制粘贴到商店后台)】
JSONTool 是一款运行在浏览器本地的 JSON 数据处理工具，提供格式化、键名排序、文本差异比对与数据表格化视图。所有数据处理均在浏览器本地内存与本地存储中执行，不依赖外部服务器，不发起任何网络连接，确保数据安全与隐私。

主要功能说明：

1. 格式化与编辑
- 一键完成标准 JSON 格式化、紧凑压缩与对象键名递归排序。
- 支持宽松 JavaScript 对象（JS Object）语法，可直接解析未加引号键名或单引号字符串。
- 内置代码高亮、代码折叠与正则搜索替换。
- 独立保持每个标签页的代码折叠状态，在标签切换时不重置折叠节点。
- 提供格式自动检测开关，可按需开启或关闭输入过程中的即时校验中断。

2. 双栏差异比对 (Diff Mode)
- 左右双栏并排比对视图，精确定位并高亮显示新增、删除与修改的字符或行。
- 比对两侧均支持独立的格式化与紧凑操作。

3. 交互式数据表格 (Table View)
- 支持将顶层或指定层级的 JSON 数组转为数据表格。
- 支持列宽自由拖拽调整、表头多维排序与全文关键词即时筛选过滤。

4. 多标签与工作区管理
- 支持多标签页并发工作与鼠标中键快速关闭。
- 提供标签右键上下文菜单：支持关闭当前、关闭其他、关闭下方、复制副本以及手动重命名。
- 自动持久化工作区草稿，关闭浏览器后重新打开自动恢复各标签页内容。

5. 系统设置与多端同步
- 遵循 Fluent 2 设计风格，提供深色与浅色模式。
- 支持自定义界面字体与代码字体，默认采用各操作系统自带的通用等宽字体，支持字体回退链设置。
- 支持精细调整界面字重 (300 至 700)、代码编辑器字号 (12px 至 20px) 与代码字重 (400 至 700)。
- 提供全局自定义 CSS 文本域，支持输入原生 CSS 样式规则实时生效。
- 提供无动画模式 (Reduced Motion)，可一键抑制全站过渡与动效。
- 提供会话自动存储控制开关；关闭后数据不落盘，并即时清除已缓存的本地草稿。
- 设置项原生接入浏览器登录账号同步通道 (chrome.storage.sync)，多设备间自动漫游。

隐私与权限说明：
- 本扩展不包含任何数据上传或外部 API 交互逻辑，无需联网即可完整使用。
- 本扩展仅申请 storage 权限，用于在浏览器本地持久化编辑器草稿 (chrome.storage.local) 以及在已登录设备间同步外观偏好设置 (chrome.storage.sync)。
- 不收集分析数据，不追踪用户行为，不使用第三方统计脚本。


============================================================
第二部分：英文资料 (English Store Listing)
============================================================

【Extension Name】
JSONTool

【Short Description (Max 132 characters)】
Local-first JSON formatter, visual diff viewer, and interactive table display for Chromium browsers. No network requests.

【Detailed Description (Copy & paste directly to store console)】
JSONTool is a local-first browser extension designed for JSON formatting, recursive key sorting, visual text diff comparison, and tabular presentation. All data processing executes strictly within the local browser runtime without external server dependencies or network transmission, ensuring data security and privacy.

Core Features:

1. Formatting and Editing
- Format, compact, and recursively sort object keys with a single click.
- Support for loose JavaScript object literals (JS Object), parsing unquoted keys and flexible syntax without errors.
- Syntax highlighting, code folding, and regex-powered find and replace.
- Per-tab code folding persistence that prevents unexpected expansions during tab switching.
- Optional automatic format detection to avoid intrusive validation interruptions while typing.

2. Side-by-Side Diff Comparison
- Two-pane side-by-side visual diff viewer highlighting insertions, deletions, and modifications.
- Independent format and compact controls on each comparison pane.

3. Interactive Table View
- Convert root or nested JSON arrays into structured interactive tables.
- Resizable columns via drag-and-drop, multi-column header sorting, and instant full-text filtering.

4. Workspace and Multi-Tab Management
- Multi-tab workspace with middle-click tab closure.
- Tab context menu with actions: close, close others, close below, duplicate copy, and manual renaming.
- Automatic session persistence preserving open editor tabs across browser restarts.

5. System Settings and Multi-Device Sync
- Built strictly around Fluent 2 design language with light and dark theme support.
- Customizable UI and editor fonts, defaulting to standard system monospace families (Consolas, Monaco, monospace) with fallback chain normalization.
- Fine-tune UI font weight (300 to 700), editor font size (12px to 20px), and editor font weight (400 to 700).
- Custom CSS text field allowing real-time native CSS rule injection.
- Reduced Motion mode to suppress interface transitions and animations for lower latency.
- Workspace auto-save toggle; disabling it prevents draft persistence and clears existing cached drafts immediately.
- Preferences automatically synchronized across devices using browser account storage (chrome.storage.sync).

Privacy and Permissions:
- No network requests: JSONTool functions 100% offline.
- Permission storage: Used exclusively to save workspace tabs locally (chrome.storage.local) and sync configuration preferences (chrome.storage.sync).
- Zero telemetry: Does not collect analytics, logs, or user behavior metrics.


============================================================
第三部分：商店元数据 (Store Metadata)
============================================================

分类 (Category):
Developer Tools (开发者工具)

主要用途 (Single Purpose):
A fast, secure, and local-first tool for formatting, comparing, and viewing JSON data directly in your browser.

主语言 (Primary Language):
Chinese (Simplified) / English

权限声明说明 (Permissions Justification):
storage: Used exclusively to persist workspace tabs locally and sync user preferences across devices via browser account storage. No data is ever transmitted to remote servers.
