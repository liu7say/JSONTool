/**
 * 编辑器共享配置模块
 * 用于 CodeEditor 和 DiffEditor 共享的基础编辑器配置
 */

import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { searchWithMatchCount } from './search-panel';
import {
	lineNumbers,
	highlightActiveLineGutter,
	highlightSpecialChars,
	drawSelection,
	dropCursor,
	rectangularSelection,
	crosshairCursor,
	highlightActiveLine,
} from '@codemirror/view';
import {
	defaultHighlightStyle,
	syntaxHighlighting,
	indentOnInput,
	bracketMatching,
	foldKeymap,
	HighlightStyle,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, autocompletion } from '@codemirror/autocomplete';

import { bracketScopeLines } from './bracket-scope-lines';
import { richCopyExtension } from './rich-copy';

import { fluentTheme } from './fluent-theme';
import { fluentFoldGutter } from './fluent-fold';

/**
 * 自定义 JavaScript 高亮样式（浅色模式）
 * 使 JS Object 模式下的语法高亮与 JSON 模式保持一致
 * 主要统一：属性名（propertyName）、字符串、数字、布尔值、null 等的颜色
 */
const jsObjectHighlightStyleLight = HighlightStyle.define([
	// 属性名 - 使用与 JSON 键相同的颜色（黑色）
	// 包括各种可能的变体标签
	{ tag: tags.propertyName, color: '#383a42' },
	{ tag: tags.definition(tags.propertyName), color: '#383a42' },
	{ tag: tags.variableName, color: '#383a42' },
	{ tag: tags.definition(tags.variableName), color: '#383a42' },
	{ tag: tags.labelName, color: '#383a42' },
	// 字符串 - 使用与 JSON 字符串相同的颜色（红色）
	{ tag: tags.string, color: '#a31515' },
	// 数字（绿色）
	{ tag: tags.number, color: '#098658' },
	// 布尔值和 null（蓝色）
	{ tag: tags.bool, color: '#0000ff' },
	{ tag: tags.null, color: '#0000ff' },
	// 标点符号（冒号、逗号、括号）
	{ tag: tags.punctuation, color: '#383a42' },
	{ tag: tags.brace, color: '#383a42' },
	{ tag: tags.squareBracket, color: '#383a42' },
]);

/**
 * 自定义 JavaScript 高亮样式（深色模式）
 * 使用与 OneDark 主题协调的颜色
 */
const jsObjectHighlightStyleDark = HighlightStyle.define([
	// 属性名 - 浅色调（与 JSON 模式一致）
	// 包括各种可能的变体标签
	{ tag: tags.propertyName, color: '#e06c75' },
	{ tag: tags.definition(tags.propertyName), color: '#e06c75' },
	{ tag: tags.variableName, color: '#e06c75' },
	{ tag: tags.definition(tags.variableName), color: '#e06c75' },
	{ tag: tags.labelName, color: '#e06c75' },
	// 字符串（绿色）
	{ tag: tags.string, color: '#98c379' },
	// 数字（橙色）
	{ tag: tags.number, color: '#d19a66' },
	// 布尔值和 null（青色）
	{ tag: tags.bool, color: '#56b6c2' },
	{ tag: tags.null, color: '#56b6c2' },
	// 标点符号
	{ tag: tags.punctuation, color: '#abb2bf' },
	{ tag: tags.brace, color: '#abb2bf' },
	{ tag: tags.squareBracket, color: '#abb2bf' },
]);

/**
 * 搜索面板本地化词条
 * 用于中文化 CodeMirror 搜索相关的 UI 文本
 */
export const editorPhrases = {
	// Search & Replace
	Find: '查找',
	Replace: '替换',
	next: '下一个',
	previous: '上一个',
	all: '全部',
	'match case': '区分大小写',
	'by word': '全字匹配',
	'case sensitive': '区分大小写',
	regexp: '正则',
	replace: '替换',
	'replace all': '替换全部',
	close: '关闭',
};

/**
 * 粘贴行为过滤器
 * 保持光标在粘贴内容的开始处，而不是结束处，防止页面跳动
 */
export const pasteTransactionFilter = EditorState.transactionFilter.of((tr) => {
	if (tr.isUserEvent('input.paste')) {
		let minFrom = Infinity;
		tr.changes.iterChanges((fromA, toA, fromB, toB) => {
			if (fromB < minFrom) minFrom = fromB;
		});

		if (minFrom !== Infinity) {
			return [
				tr,
				{
					selection: { anchor: minFrom },
					scrollIntoView: true,
				},
			];
		}
	}
	return tr;
});

/**
 * 基础编辑器配置（不包含语言支持）
 * 包含所有编辑器共享的核心功能扩展
 * 语言支持在 getEditorExtensions 中根据参数动态添加
 */
export const baseEditorExtensions = [
	EditorState.phrases.of(editorPhrases), // 本地化
	lineNumbers(),
	highlightActiveLineGutter(),
	highlightSpecialChars(),
	history(),
	fluentFoldGutter, // 自定义折叠槽
	drawSelection(),
	dropCursor(),
	EditorState.allowMultipleSelections.of(true),
	indentOnInput(),
	syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
	bracketMatching(),
	closeBrackets(),
	autocompletion(),
	rectangularSelection(),
	crosshairCursor(),
	highlightActiveLine(),
	highlightSelectionMatches(),
	keymap.of([
		// 屏蔽注释快捷键，JSON/JS Object 不支持注释语法
		{ key: 'Mod-/', run: () => true },
		...defaultKeymap,
		...historyKeymap,
		...searchKeymap,
		...foldKeymap,
		indentWithTab, // Tab 键缩进支持
	]),
	// 注意：语言支持（json/javascript）已移至 getEditorExtensions 中动态选择
	fluentTheme, // Fluent 主题
	...bracketScopeLines, // JSON 括号范围线
	...searchWithMatchCount, // 带匹配计数的搜索面板
	pasteTransactionFilter, // 粘贴行为控制
	richCopyExtension, // 富文本复制（保留语法高亮）
];

/**
 * 获取带主题切换和语言支持的完整扩展配置
 * @param {boolean} isDark - 是否使用深色主题
 * @param {Array} additionalExtensions - 额外的扩展配置
 * @param {Object} options - 选项配置
 * @param {string} options.language - 语言模式：'json'（默认）或 'javascript'（用于 JS Object 格式）
 * @returns {Array} 完整的扩展配置数组
 */
export const getEditorExtensions = (
	isDark,
	additionalExtensions = [],
	options = {},
) => {
	const { language = 'json' } = options;

	// 根据语言模式选择不同的语言解析器和高亮样式
	// JS Object 格式（无引号的键名）需要使用 JavaScript 解析器才能正确解析语法树，确保折叠功能正常
	// 同时使用自定义高亮样式使颜色与 JSON 模式保持一致
	const languageExtension = language === 'javascript' ? javascript() : json();

	const extensions = [
		...baseEditorExtensions,
		languageExtension,
		...additionalExtensions,
	];

	// 深色模式先加载 oneDark 主题
	if (isDark) {
		extensions.push(oneDark);
	}

	// JavaScript 模式下添加自定义高亮样式，覆盖默认的 JS 高亮颜色
	// 必须在 oneDark 之后添加，才能覆盖其样式
	if (language === 'javascript') {
		const highlightStyle = isDark
			? jsObjectHighlightStyleDark
			: jsObjectHighlightStyleLight;
		extensions.push(syntaxHighlighting(highlightStyle));
	}

	return extensions;
};
