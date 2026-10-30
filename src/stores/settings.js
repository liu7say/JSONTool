import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * 界面字体预设选项
 */
export const UI_FONT_PRESETS = [
	{
		label: '系统默认 (System Default)',
		value: 'default',
		css: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'PingFang SC', sans-serif",
	},
	{
		label: 'Inter',
		value: 'Inter',
		css: "'Inter', sans-serif",
	},
	{
		label: 'Segoe UI (Fluent 推荐)',
		value: 'Segoe UI',
		css: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
	},
	{
		label: '微软雅黑 (Microsoft YaHei)',
		value: 'Microsoft YaHei',
		css: "'Microsoft YaHei', sans-serif",
	},
	{
		label: '苹方 (PingFang SC)',
		value: 'PingFang SC',
		css: "'PingFang SC', -apple-system, sans-serif",
	},
	{
		label: '自定义 (Custom)',
		value: 'custom',
		css: '',
	},
];

/**
 * 编辑器代码字体预设选项（默认使用绝大多数系统均自带的等宽字体）
 */
export const EDITOR_FONT_PRESETS = [
	{
		label: '系统默认等宽 (Consolas / Monaco)',
		value: 'default',
		css: "Consolas, Monaco, Menlo, 'Courier New', monospace",
	},
	{
		label: 'Consolas (Windows 标配)',
		value: 'Consolas',
		css: "Consolas, 'Courier New', monospace",
	},
	{
		label: 'Monaco / Menlo (Mac 标配)',
		value: 'Monaco',
		css: "Monaco, Menlo, Consolas, monospace",
	},
	{
		label: 'Cascadia Code',
		value: 'Cascadia Code',
		css: "'Cascadia Code', Consolas, monospace",
	},
	{
		label: 'JetBrains Mono',
		value: 'JetBrains Mono',
		css: "'JetBrains Mono', Consolas, monospace",
	},
	{
		label: 'Fira Code',
		value: 'Fira Code',
		css: "'Fira Code', Consolas, monospace",
	},
	{
		label: '自定义 (Custom)',
		value: 'custom',
		css: '',
	},
];

/**
 * 界面字重可选范围
 */
export const UI_FONT_WEIGHT_OPTIONS = [
	{ label: '300 (纤细 Light)', value: 300 },
	{ label: '400 (常规 Regular)', value: 400 },
	{ label: '500 (中等 Medium)', value: 500 },
	{ label: '600 (半粗 Semibold)', value: 600 },
	{ label: '700 (粗体 Bold)', value: 700 },
];

/**
 * 编辑器字号可选范围 (px)
 */
export const EDITOR_FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18, 20];

/**
 * 编辑器字重可选范围
 */
export const EDITOR_FONT_WEIGHT_OPTIONS = [
	{ label: '400 (常规 Regular)', value: 400 },
	{ label: '500 (中等 Medium)', value: 500 },
	{ label: '600 (半粗 Semibold)', value: 600 },
	{ label: '700 (粗体 Bold)', value: 700 },
];

/**
 * 格式化用户输入的字体族字符串，正确解析逗号分隔的字体回退链并为含空格字体补齐单引号
 * 规避暴力在外层包裹双引号导致逗号分隔的字体链被误判为单一字体名的 Bug
 * @param {string} input 用户输入的字体配置，例如 "'Maple Mono NF CN', MiSans" 或 "Cascadia Code, Consolas"
 * @returns {string} 符合 CSS font-family 规范的字体链字符串
 */
export const normalizeFontFamily = (input) => {
	if (!input || typeof input !== 'string') return '';

	// CSS 规范内置的通用族名关键字，按标准不得加引号
	const genericKeywords = new Set([
		'serif',
		'sans-serif',
		'monospace',
		'cursive',
		'fantasy',
		'system-ui',
		'ui-serif',
		'ui-sans-serif',
		'ui-monospace',
		'ui-rounded',
		'math',
		'emoji',
		'fangsong',
	]);

	const parts = input
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length === 0) return '';

	const formattedParts = parts
		.map((item) => {
			// 移除可能已存在的一对首尾引号（单引号或双引号）
			let unquoted = item;
			if (
				(item.startsWith("'") && item.endsWith("'")) ||
				(item.startsWith('"') && item.endsWith('"'))
			) {
				unquoted = item.slice(1, -1).trim();
			}

			if (!unquoted) return '';

			// 若属于 CSS 通用关键字，则保持无引号原生形式
			if (genericKeywords.has(unquoted.toLowerCase())) {
				return unquoted.toLowerCase();
			}

			// 为字体名统一包裹规范单引号，防止内部包含空格或非 ASCII 字符引起 CSS 解析中断
			return `'${unquoted.replace(/'/g, "\\'")}'`;
		})
		.filter(Boolean);

	return formattedParts.join(', ');
};

/**
 * 设置仓库
 * 将用户配置持久化到 chrome.storage.sync（自动随浏览器登录账号进行多端同步，带有 localStorage 回退）
 */
export const useSettingsStore = defineStore('settings', () => {
	// --- 状态字段 ---
	// 基础格式与排序设置
	const sortStructureAtEnd = ref(false);
	const indent = ref(2);
	const autoFormatDetection = ref(true);

	// 自定义字体与样式设置
	const uiFont = ref('default');
	const customUiFont = ref('');
	const uiFontWeight = ref(400);
	const editorFont = ref('default');
	const customEditorFont = ref('');
	const editorFontSize = ref(14);
	const editorFontWeight = ref(400);
	const customCss = ref('');

	// 动效开关（无动画模式）
	const reducedMotion = ref(false);

	// 编辑器数据是否自动存储工作区草稿（默认开启）
	const autoSaveWorkspace = ref(true);

	// --- 助手：通用存储访问（chrome.storage.sync 多端同步） ---
	const storage = {
		get: (defaults) =>
			new Promise((resolve) => {
				// Chrome 扩展环境
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.get(defaults, (items) => {
						resolve(items);
					});
				} else {
					// Web 环境 (本地开发或非扩展环境)
					const result = { ...defaults };
					Object.keys(defaults).forEach((key) => {
						const val = localStorage.getItem('settings.' + key);
						if (val !== null) {
							try {
								result[key] = JSON.parse(val);
							} catch (e) {
								console.warn('Failed to parse setting:', key, val);
							}
						}
					});
					resolve(result);
				}
			}),
		set: (items) =>
			new Promise((resolve) => {
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.set(items, () => resolve());
				} else {
					Object.entries(items).forEach(([key, val]) => {
						localStorage.setItem('settings.' + key, JSON.stringify(val));
					});
					resolve();
				}
			}),
	};

	/**
	 * 应用动态副作用到 DOM（CSS 变量与属性）
	 */
	const applyEffects = () => {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;

		// 1. 动态应用界面字体与字重
		let uiCss = '';
		if (uiFont.value === 'custom') {
			const normalized = normalizeFontFamily(customUiFont.value);
			uiCss = normalized
				? `${normalized}, 'Inter', system-ui, sans-serif`
				: UI_FONT_PRESETS[0].css;
		} else {
			const found = UI_FONT_PRESETS.find((p) => p.value === uiFont.value);
			uiCss = found && found.css ? found.css : UI_FONT_PRESETS[0].css;
		}
		root.style.setProperty('--fontFamilyBase', uiCss);
		root.style.setProperty('--uiFontWeight', String(uiFontWeight.value));

		// 2. 动态应用代码编辑器字体
		let editorCss = '';
		if (editorFont.value === 'custom') {
			const normalized = normalizeFontFamily(customEditorFont.value);
			editorCss = normalized
				? `${normalized}, Consolas, Monaco, monospace`
				: EDITOR_FONT_PRESETS[0].css;
		} else {
			const found = EDITOR_FONT_PRESETS.find((p) => p.value === editorFont.value);
			editorCss = found && found.css ? found.css : EDITOR_FONT_PRESETS[0].css;
		}
		root.style.setProperty('--fontFamilyMonospace', editorCss);

		// 3. 动态应用代码编辑器字号与字重
		root.style.setProperty('--editorFontSize', `${editorFontSize.value}px`);
		root.style.setProperty('--editorFontWeight', String(editorFontWeight.value));

		// 4. 动态应用无动画模式 (Reduced Motion)
		if (reducedMotion.value) {
			root.setAttribute('data-reduced-motion', 'true');
		} else {
			root.removeAttribute('data-reduced-motion');
		}

		// 5. 动态挂载并应用用户自定义 CSS 样式规则
		let styleEl = document.getElementById('jsontool-custom-css');
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = 'jsontool-custom-css';
			document.head.appendChild(styleEl);
		}
		styleEl.textContent = customCss.value || '';
	};

	// --- 动作：加载设置 ---
	const loadSettings = async () => {
		const defaults = {
			sortStructureAtEnd: false,
			indent: 2,
			autoFormatDetection: true,
			uiFont: 'default',
			customUiFont: '',
			uiFontWeight: 400,
			editorFont: 'default',
			customEditorFont: '',
			editorFontSize: 14,
			editorFontWeight: 400,
			customCss: '',
			reducedMotion: false,
			autoSaveWorkspace: true,
		};
		const data = await storage.get(defaults);

		sortStructureAtEnd.value = !!data.sortStructureAtEnd;
		indent.value = data.indent;
		autoFormatDetection.value = data.autoFormatDetection !== false;

		uiFont.value = data.uiFont || 'default';
		customUiFont.value = data.customUiFont || '';
		uiFontWeight.value = Number(data.uiFontWeight) || 400;
		editorFont.value = data.editorFont || 'default';
		customEditorFont.value = data.customEditorFont || '';
		editorFontSize.value = Number(data.editorFontSize) || 14;
		editorFontWeight.value = Number(data.editorFontWeight) || 400;
		customCss.value = typeof data.customCss === 'string' ? data.customCss : '';

		reducedMotion.value = !!data.reducedMotion;
		autoSaveWorkspace.value = data.autoSaveWorkspace !== false;

		// 装载完成后立即应用视觉与动效设定
		applyEffects();
	};

	// --- 监听器：响应式持久化并多端同步 ---
	watch(sortStructureAtEnd, (newVal) => {
		storage.set({ sortStructureAtEnd: newVal });
	});
	watch(indent, (newVal) => {
		storage.set({ indent: newVal });
	});
	watch(autoFormatDetection, (newVal) => {
		storage.set({ autoFormatDetection: newVal });
	});

	watch([uiFont, customUiFont], ([newFont, newCustom]) => {
		storage.set({ uiFont: newFont, customUiFont: newCustom });
		applyEffects();
	});

	watch(uiFontWeight, (newVal) => {
		storage.set({ uiFontWeight: newVal });
		applyEffects();
	});

	watch([editorFont, customEditorFont], ([newFont, newCustom]) => {
		storage.set({ editorFont: newFont, customEditorFont: newCustom });
		applyEffects();
	});

	watch(editorFontSize, (newVal) => {
		storage.set({ editorFontSize: newVal });
		applyEffects();
	});

	watch(editorFontWeight, (newVal) => {
		storage.set({ editorFontWeight: newVal });
		applyEffects();
	});

	watch(reducedMotion, (newVal) => {
		storage.set({ reducedMotion: newVal });
		applyEffects();
	});

	watch(autoSaveWorkspace, (newVal) => {
		storage.set({ autoSaveWorkspace: newVal });
	});

	watch(customCss, (newVal) => {
		storage.set({ customCss: newVal });
		applyEffects();
	});

	return {
		sortStructureAtEnd,
		indent,
		autoFormatDetection,
		uiFont,
		customUiFont,
		uiFontWeight,
		editorFont,
		customEditorFont,
		editorFontSize,
		editorFontWeight,
		customCss,
		reducedMotion,
		autoSaveWorkspace,
		applyEffects,
		loadSettings,
	};
});
