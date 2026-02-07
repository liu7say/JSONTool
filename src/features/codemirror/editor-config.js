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
} from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, autocompletion } from '@codemirror/autocomplete';

import { bracketScopeLines } from './bracket-scope-lines';

import { fluentTheme } from './fluent-theme';
import { fluentFoldGutter } from './fluent-fold';

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

	// 根据语言模式选择不同的语言解析器
	// JS Object 格式（无引号的键名）需要使用 JavaScript 解析器才能正确解析语法树，确保折叠功能正常
	const languageExtension = language === 'javascript' ? javascript() : json();

	const extensions = [
		...baseEditorExtensions,
		languageExtension,
		...additionalExtensions,
	];
	if (isDark) {
		extensions.push(oneDark);
	}
	return extensions;
};
