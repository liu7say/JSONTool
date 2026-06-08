<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
// CodeMirror 核心
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { lintGutter, linter, nextDiagnostic } from '@codemirror/lint';
import { search } from '@codemirror/search';
import {
	foldAll,
	unfoldAll,
	ensureSyntaxTree,
	foldedRanges,
	foldEffect,
	unfoldEffect,
} from '@codemirror/language';

import { useThemeStore } from '../stores/theme';
import { useSettingsStore } from '../stores/settings';
import { getEditorExtensions } from '../features/codemirror/editor-config';
import { relaxedJsonParse } from '../features/json/parse';
import { stringifyJson } from '../features/json/stringify';

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	readonly: {
		type: Boolean,
		default: false,
	},
	autoFormatDetection: {
		type: Boolean,
		default: true,
	},
	foldRanges: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits([
	'update:modelValue',
	'change',
	'paste-into-empty',
	'update:foldRanges',
]);

const editorContainer = ref(null);
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
let editorView = null;
// 当前使用的语言模式：'json' 或 'javascript'
let currentLanguage = 'json';

// 去除 BOM 头
const stripBom = (text) =>
	text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

/**
 * 检测文本是否为 JS Object 格式（即不是有效 JSON 但可以被宽松解析）
 * JS Object 格式特征：键名不带引号，使用单引号等
 * @param {string} text - 要检测的文本
 * @returns {boolean} 是否为 JS Object 格式
 */
const isJsObjectFormat = (text) => {
	if (!text || !text.trim()) return false;
	const cleaned = stripBom(text);
	try {
		JSON.parse(cleaned);
		// 能直接解析为 JSON，使用 JSON 解析器
		return false;
	} catch (e) {
		// JSON 解析失败，尝试 relaxedJsonParse
		try {
			relaxedJsonParse(cleaned);
			// 宽松解析成功，说明是 JS Object 格式
			return true;
		} catch (e2) {
			// 连宽松解析都失败，可能是无效内容，默认用 JSON
			return false;
		}
	}
};

/**
 * 尝试从错误信息中提取位置信息
 * @param {string} errorMessage
 * @returns {number|null}
 */
const getJsonErrorPosition = (errorMessage) => {
	const match = String(errorMessage || '').match(/position\s+(\d+)/i);
	if (!match) return null;
	const pos = Number(match[1]);
	return Number.isFinite(pos) ? pos : null;
};

/**
 * 向前查找非空白字符
 */
const findNonWhitespaceBackward = (text, start) => {
	for (let i = Math.min(start, text.length - 1); i >= 0; i--) {
		if (!/\s/.test(text[i])) return i;
	}
	return 0;
};

/**
 * 构建 JSON 解析错误的 Diagnostics
 * 准确的错误定位是提升开发者体验的关键。
 * 我们不仅要告诉用户错了，还要尽可能精确地指出是哪里错了。
 */
const buildJsonDiagnostics = (sourceText, parseError) => {
	const original = String(sourceText || '');
	if (!original.trim()) return [];

	const hasBom = original.charCodeAt(0) === 0xfeff;
	const cleanedOffset = hasBom ? 1 : 0;

	const basePos = getJsonErrorPosition(parseError);
	const docLen = original.length;

	let pos =
		basePos == null
			? docLen - 1
			: Math.min(Math.max(basePos + cleanedOffset, 0), docLen - 1);

	// 定位优化：如果指向了空白，尝试向前寻找具体的符号
	if (/\s/.test(original[pos])) {
		pos = findNonWhitespaceBackward(original, pos);
	}

	// 特殊情况：如果报错 Unexpected string 且指向引号，可能是漏了逗号，尝试再向前找
	if (
		parseError &&
		/Unexpected\s+string/i.test(parseError) &&
		original[pos] === '"'
	) {
		pos = findNonWhitespaceBackward(original, pos - 1);
	}

	const from = Math.max(0, pos);
	const to = Math.min(docLen, from + 1);
	return [
		{
			from,
			to,
			severity: 'error',
			message: String(parseError || 'JSON 解析失败'),
		},
	];
};

const jsonSyntaxLinter = () => (view) => {
	try {
		const original = view.state.doc.toString();
		if (!original.trim()) return [];

		const cleaned = stripBom(original);
		try {
			JSON.parse(cleaned);
			return [];
		} catch (error) {
			// Try relaxed parse (JS Object)
			try {
				relaxedJsonParse(cleaned);
				return []; // Valid JS Object, suppress error
			} catch (e) {
				const message = error instanceof Error ? error.message : String(error);
				return buildJsonDiagnostics(original, message);
			}
		}
	} catch (unexpectedError) {
		// 捕获所有意外异常，防止 linter 错误导致编辑器状态损坏
		console.warn('[JSONTool] Linter 意外错误:', unexpectedError);
		return [];
	}
};

let applyingFoldRanges = false;

const normalizeFoldRanges = (ranges, docLength) => {
	if (!Array.isArray(ranges)) return [];
	return ranges
		.map((range) => ({
			from: Number(range?.from),
			to: Number(range?.to),
		}))
		.filter(
			(range) =>
				Number.isFinite(range.from) &&
				Number.isFinite(range.to) &&
				range.from >= 0 &&
				range.to > range.from &&
				range.to <= docLength,
		)
		.sort((a, b) => a.from - b.from || a.to - b.to);
};

const rangesEqual = (left, right) => {
	if (left.length !== right.length) return false;
	return left.every(
		(range, index) =>
			range.from === right[index].from && range.to === right[index].to,
	);
};

const getFoldRanges = (view) => {
	const ranges = [];
	foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
		ranges.push({ from, to });
	});
	return ranges;
};

const emitFoldRanges = () => {
	if (!editorView || applyingFoldRanges) return;
	emit('update:foldRanges', getFoldRanges(editorView));
};

const hasFoldChanged = (update) =>
	update.transactions.some((transaction) =>
		transaction.effects.some(
			(effect) => effect.is(foldEffect) || effect.is(unfoldEffect),
		),
	);

const applyFoldRanges = (ranges) => {
	if (!editorView) return;

	const nextRanges = normalizeFoldRanges(ranges, editorView.state.doc.length);
	const currentRanges = getFoldRanges(editorView);
	if (rangesEqual(currentRanges, nextRanges)) return;

	const effects = [
		...currentRanges.map((range) => unfoldEffect.of(range)),
		...nextRanges.map((range) => foldEffect.of(range)),
	];
	if (!effects.length) return;

	applyingFoldRanges = true;
	editorView.dispatch({ effects });
	applyingFoldRanges = false;
};

const jumpToNextError = () => {
	if (!editorView) return;
	nextDiagnostic(editorView);
	editorView.focus();
};

const expandAll = () => {
	if (!editorView) return;
	unfoldAll(editorView);
};

const collapseAll = () => {
	if (!editorView) return;
	ensureSyntaxTree(editorView.state, editorView.state.doc.length, 5000);
	foldAll(editorView);
};

defineExpose({ jumpToNextError, expandAll, collapseAll });

const getDocumentLanguage = (text) =>
	props.autoFormatDetection && isJsObjectFormat(text) ? 'javascript' : 'json';

// CodeEditor 特有的扩展配置（Lint、搜索、自动格式化）
const getCodeEditorExtensions = () => [
	search({ top: true }), // 搜索框在顶部
	...(props.autoFormatDetection ? [lintGutter(), linter(jsonSyntaxLinter())] : []),
	EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			const newVal = update.state.doc.toString();
			emit('update:modelValue', newVal);
			emit('change', newVal);

			// 自动格式化：当粘贴到空文档时，自动进行格式化
			if (
				props.autoFormatDetection &&
				update.startState.doc.length === 0 &&
				update.transactions.some((tr) => tr.isUserEvent('input.paste'))
			) {
				setTimeout(() => {
					if (!editorView) return;
					const currentDoc = editorView.state.doc.toString();
					if (currentDoc.trim()) {
						try {
							const parsed = JSON.parse(currentDoc);
							// 使用用户选择的缩进设置
							const indentSetting = settingsStore.indent;
							let formatted;
							if (indentSetting === 'jsObj') {
								// JS Object 格式
								formatted = stringifyJson({
									value: parsed,
									indent: 2,
									format: 'jsObj',
								});
							} else {
								// 标准 JSON 格式
								const indent =
									typeof indentSetting === 'number' ? indentSetting : 2;
								formatted = JSON.stringify(parsed, null, indent);
							}
							if (formatted !== currentDoc) {
								editorView.dispatch({
									changes: {
										from: 0,
										to: editorView.state.doc.length,
										insert: formatted,
									},
									selection: { anchor: 0 },
									scrollIntoView: true,
									userEvent: 'input.format.auto',
								});
							}
						} catch (e) {}
					}
				}, 16);
			}
		}

		if (hasFoldChanged(update)) emitFoldRanges();
	}),
	EditorState.readOnly.of(props.readonly),
];

// 组装所有 Editor 扩展（使用共享配置 + CodeEditor 特有配置）
// language 参数：'json'（默认）或 'javascript'（用于 JS Object 格式）
const getExtensions = (isDark, language = 'json') => {
	return getEditorExtensions(isDark, getCodeEditorExtensions(), { language });
};

const initEditor = () => {
	if (!editorContainer.value) return;

	// 检测初始内容的格式并选择合适的语言解析器
	currentLanguage = getDocumentLanguage(props.modelValue);

	const state = EditorState.create({
		doc: props.modelValue,
		extensions: getExtensions(themeStore.isDark, currentLanguage),
	});

	editorView = new EditorView({
		state,
		parent: editorContainer.value,
	});
	applyFoldRanges(props.foldRanges);
};

watch(
	() => props.modelValue,
	(newVal) => {
		if (!editorView) return;

		// 检测格式变化，如果语言模式需要切换则重建编辑器
		const newLanguage = getDocumentLanguage(newVal);

		if (newLanguage !== currentLanguage) {
			// 语言模式变化，需要重建编辑器以应用新的语法解析器
			currentLanguage = newLanguage;
			editorView.destroy();

			const state = EditorState.create({
				doc: newVal,
				extensions: getExtensions(themeStore.isDark, currentLanguage),
				// 不保持旧的 selection，因为新文档可能更短导致选择点超出范围
			});

			editorView = new EditorView({
				state,
				parent: editorContainer.value,
			});
			applyFoldRanges(props.foldRanges);
		} else if (newVal !== editorView.state.doc.toString()) {
			// 语言模式未变，直接更新内容
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: newVal },
			});
		}
	},
);

watch(
	() => themeStore.isDark,
	(isDark) => {
		if (!editorView) return;
		// 重建编辑器以切换主题高亮（保持当前语言模式）
		const content = editorView.state.doc.toString();
		const selection = editorView.state.selection;

		editorView.destroy();

		const state = EditorState.create({
			doc: content,
			extensions: getExtensions(isDark, currentLanguage),
			selection,
		});

		editorView = new EditorView({
			state,
			parent: editorContainer.value,
		});
		applyFoldRanges(props.foldRanges);
	},
);

watch(
	() => props.readonly,
	(val) => {
		if (!editorView) return;
		const content = editorView.state.doc.toString();
		editorView.destroy();
		const state = EditorState.create({
			doc: content,
			extensions: getExtensions(themeStore.isDark, currentLanguage),
		});
		editorView = new EditorView({ state, parent: editorContainer.value });
		applyFoldRanges(props.foldRanges);
	},
);

watch(
	() => props.autoFormatDetection,
	() => {
		if (!editorView) return;
		const content = editorView.state.doc.toString();
		const selection = editorView.state.selection;
		currentLanguage = getDocumentLanguage(content);
		editorView.destroy();
		const state = EditorState.create({
			doc: content,
			extensions: getExtensions(themeStore.isDark, currentLanguage),
			selection,
		});
		editorView = new EditorView({ state, parent: editorContainer.value });
		applyFoldRanges(props.foldRanges);
	},
);

watch(
	() => props.foldRanges,
	(ranges) => applyFoldRanges(ranges),
	{ deep: true },
);

onMounted(() => {
	initEditor();
});

onBeforeUnmount(() => {
	if (editorView) {
		editorView.destroy();
	}
});
</script>

<template>
	<div class="code-editor-wrapper" ref="editorContainer"></div>
</template>

<style scoped>
.code-editor-wrapper {
	height: 100%;
	width: 100%;
	overflow: hidden;
	min-height: 0;
}

:deep(.cm-gutter-lint) {
	width: 0;
}
</style>
