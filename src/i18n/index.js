import { createI18n } from 'vue-i18n';

export const LOCALE_STORAGE_KEY = 'jsontool.locale';
export const SUPPORTED_LOCALES = ['zh', 'en'];

const normalizeLocale = (value) => {
	const locale = String(value || '').toLowerCase();
	if (locale.startsWith('zh')) return 'zh';
	if (locale.startsWith('en')) return 'en';
	return '';
};

export const detectLocale = () => {
	// 服务端或测试环境安全回退
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'en';

	const saved = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
	if (saved) return saved;

	const browserLocales = [
		typeof navigator !== 'undefined' ? navigator.language : '',
		...(typeof navigator !== 'undefined' && Array.isArray(navigator.languages)
			? navigator.languages
			: []),
	];
	return browserLocales.some((item) => normalizeLocale(item) === 'zh')
		? 'zh'
		: 'en';
};

export const messages = {
	zh: {
		common: {
			language: '语言',
			chinese: '中文',
			english: 'English',
			ready: '就绪',
			characters: '字符',
			delete: '删除',
			switch: '开关',
		},
		app: {
			tableView: '表格视图',
			back: '返回',
			diff: '对比',
			exitDiff: '退出对比',
			nextDiff: '下一个差异',
			nextDiffTitle: '跳转到下一个差异',
			jumpToError: '跳到错误',
			format: '格式化',
			formatOptions: '格式化选项',
			autoFormat: '自动格式化',
			indentSpaces: '{count} 空格',
			indent2Spaces: '2 空格',
			indent4Spaces: '4 空格',
			indentTab: 'Tab 缩进',
			indentJsObj: 'JS Object',
			escape: '转义',
			escapeTitle: '将内容转义为 JSON 字符串',
			unescape: '去转义',
			unescapeTitle: '去除 JSON 字符串转义',
			compact: '压缩',
			compactTitle: '去除空白与换行压缩 JSON',
			compactDesc: '去除空白与换行压缩 JSON',
			compress: '压缩',
			compressDesc: '去除空白与换行压缩 JSON',
			sort: '排序',
			sortTitle: '按 Keys 排序',
			sortOptions: '排序选项',
			structureAtEnd: '结构类型在后',
			sortStructureAtEnd: '结构类型在后',
			unicodeToChinese: 'Uni->中',
			unicodeToChineseTitle: '将 Unicode 转义序列转换为中文',
			chineseToUnicode: '中->Uni',
			chineseToUnicodeTitle: '将中文转换为 Unicode 转义序列',
			expandAll: '全部展开',
			expandAllTitle: '全部展开',
			collapseAll: '全部收起',
			collapseAllTitle: '全部收起',
			saveSnapshot: '保存快照',
			saveSnapshotTitle: '只会保存当前标签页的快照',
			history: '历史记录',
			historyTitle: '历史记录',
			themeToLight: '切换到亮色模式',
			themeToDark: '切换到暗色模式',
			collapseSidebar: '收起',
			expandSidebar: '展开',
			closeTab: '关闭',
			closeOtherTabs: '关闭其他',
			closeTabsBelow: '关闭下方',
			duplicateTab: '复制标签页',
			renameTab: '重命名',
			copySuffix: '副本',
			newTab: '新建标签页',
			noOpenFiles: '没有打开的文件',
			newJson: '新建 JSON',
			noHistory: '暂无历史记录',
			clearAll: '清空全部',
			deleteEntry: '删除',
			untitledSnapshot: '未命名快照',
			savedSnapshot: '已保存当前标签页快照',
			inputJson: '请输入 JSON',
			jsonValid: 'JSON 有效 • {count} 字符',
			tableStatus: '表格模式 • 路径: {path}',
			topLevel: '(顶层)',
			diffStatus:
				'对比模式 • 主文档: {main} 字符 • 对比文档: {compare} 字符',
		},
		editor: {
			arrayPath: '数组路径:',
			topArray: '(顶层数组)',
			searchTable: '搜索表格内容...',
			chooseArrayField: '请选择一个数组字段',
			sorting: '排序中...',
			jsonParseFailed: 'JSON 解析失败',
			selectedPathNotArray: '所选路径不是数组，请选择其他路径',
			emptyArray: '数组为空',
			linterErrorPrefix: '[JSONTool] Linter 意外错误:',
		},
		settings: {
			title: '设置',
			appearance: '外观与字体',
			uiFont: '界面字体',
			uiFontWeight: '界面字重',
			editorFont: '代码字体',
			editorFontSize: '代码字号',
			editorFontWeight: '代码字重',
			customFontPlaceholder: '输入字体名称，如 PingFang SC',
			customEditorFontPlaceholder: '输入代码字体名称，如 Cascadia Code',
			customCss: '自定义 CSS',
			customCssDesc: '注入原生全局 CSS 样式规则，实时微调界面与编辑器外观',
			customCssPlaceholder:
				"/* 输入全局自定义 CSS，例如：\n.f-button {'{'} border-radius: 8px; {'}'}\n*/",
			reducedMotion: '无动画模式',
			reducedMotionDesc: '禁用全站切换与过渡动画，适合低配设备或偏好极速静态响应',
			editingAndStorage: '编辑与存储',
			autoSave: '数据自动存储',
			autoSaveDesc: '在输入过程中自动保存会话草稿；关闭后保护敏感数据不落盘，刷新或重启扩展恢复为空白或默认状态',
			autoFormat: '格式自动检测',
			autoFormatDesc: '输入过程中实时检测 JSON 语法错误并予以标注',
			syncNotice: '设置已自动随浏览器登录账号进行多端同步 (chrome.storage.sync)',
		},
	},
	en: {
		common: {
			language: 'Language',
			chinese: '中文',
			english: 'English',
			ready: 'Ready',
			characters: 'characters',
			delete: 'Delete',
			switch: 'Switch',
		},
		app: {
			tableView: 'Table View',
			back: 'Back',
			diff: 'Diff',
			exitDiff: 'Exit Diff',
			nextDiff: 'Next Diff',
			nextDiffTitle: 'Jump to next difference',
			jumpToError: 'Jump to Error',
			format: 'Format',
			formatOptions: 'Format Options',
			autoFormat: 'Auto Format',
			indentSpaces: '{count} spaces',
			indent2Spaces: '2 spaces',
			indent4Spaces: '4 spaces',
			indentTab: 'Tab indent',
			indentJsObj: 'JS Object',
			escape: 'Escape',
			escapeTitle: 'Escape content as a JSON string',
			unescape: 'Unescape',
			unescapeTitle: 'Remove JSON string escaping',
			compact: 'Compact',
			compactTitle: 'Minify JSON by removing whitespaces and newlines',
			compactDesc: 'Minify JSON by removing whitespaces and newlines',
			compress: 'Compact',
			compressDesc: 'Minify JSON by removing whitespaces and newlines',
			sort: 'Sort',
			sortTitle: 'Sort by keys',
			sortOptions: 'Sort Options',
			structureAtEnd: 'Structures Last',
			sortStructureAtEnd: 'Structures Last',
			unicodeToChinese: 'Uni->CN',
			unicodeToChineseTitle: 'Convert Unicode escapes to Chinese',
			chineseToUnicode: 'CN->Uni',
			chineseToUnicodeTitle: 'Convert Chinese characters to Unicode escapes',
			expandAll: 'Expand All',
			expandAllTitle: 'Expand all',
			collapseAll: 'Collapse All',
			collapseAllTitle: 'Collapse all',
			saveSnapshot: 'Save Snapshot',
			saveSnapshotTitle: 'Save only a snapshot of the current tab',
			history: 'History',
			historyTitle: 'History',
			themeToLight: 'Switch to light mode',
			themeToDark: 'Switch to dark mode',
			collapseSidebar: 'Collapse',
			expandSidebar: 'Expand',
			closeTab: 'Close',
			closeOtherTabs: 'Close Others',
			closeTabsBelow: 'Close Below',
			duplicateTab: 'Duplicate Tab',
			renameTab: 'Rename',
			copySuffix: 'Copy',
			newTab: 'New Tab',
			noOpenFiles: 'No open files',
			newJson: 'New JSON',
			noHistory: 'No history yet',
			clearAll: 'Clear All',
			deleteEntry: 'Delete',
			untitledSnapshot: 'Untitled Snapshot',
			savedSnapshot: 'Current tab snapshot saved',
			inputJson: 'Enter JSON',
			jsonValid: 'Valid JSON • {count} characters',
			tableStatus: 'Table mode • Path: {path}',
			topLevel: '(top level)',
			diffStatus:
				'Diff mode • Main: {main} characters • Compare: {compare} characters',
		},
		editor: {
			arrayPath: 'Array path:',
			topArray: '(top-level array)',
			searchTable: 'Search table content...',
			chooseArrayField: 'Select an array field',
			sorting: 'Sorting...',
			jsonParseFailed: 'JSON parse failed',
			selectedPathNotArray: 'Selected path is not an array. Choose another path.',
			emptyArray: 'Array is empty',
			linterErrorPrefix: '[JSONTool] Unexpected linter error:',
		},
		settings: {
			title: 'Settings',
			appearance: 'Appearance & Typography',
			uiFont: 'UI Font',
			uiFontWeight: 'UI Font Weight',
			editorFont: 'Editor Font',
			editorFontSize: 'Font Size',
			editorFontWeight: 'Font Weight',
			customFontPlaceholder: 'Enter font name, e.g. Segoe UI',
			customEditorFontPlaceholder: 'Enter monospace font name, e.g. Cascadia Code',
			customCss: 'Custom CSS',
			customCssDesc: 'Inject native global CSS rules to customize UI and editor appearance in real-time',
			customCssPlaceholder:
				"/* Enter global custom CSS, e.g.:\n.f-button {'{'} border-radius: 8px; {'}'}\n*/",
			reducedMotion: 'Reduced Motion',
			reducedMotionDesc: 'Disable all transitions and animations throughout the interface',
			editingAndStorage: 'Editing & Storage',
			autoSave: 'Auto-save Workspace Data',
			autoSaveDesc: 'Automatically persist session drafts; disable to prevent sensitive data from saving to disk',
			autoFormat: 'Auto Format Detection',
			autoFormatDesc: 'Automatically detect and highlight JSON syntax errors during typing',
			syncNotice: 'All settings are synced across devices via browser account (chrome.storage.sync)',
		},
	},
};

export const i18n = createI18n({
	legacy: false,
	locale: detectLocale(),
	fallbackLocale: 'en',
	messages,
});

export const setLocale = (locale) => {
	const nextLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
	i18n.global.locale.value = nextLocale;
	localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
};
