<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
// CodeMirror 核心
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { lintGutter, linter, nextDiagnostic } from '@codemirror/lint';
import { search } from '@codemirror/search';
import { foldAll, unfoldAll, ensureSyntaxTree } from '@codemirror/language';

import { useThemeStore } from '../stores/theme';
import { getEditorExtensions } from '../features/codemirror/editor-config';
import { relaxedJsonParse } from '../features/json/parse';

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	readonly: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:modelValue', 'change', 'paste-into-empty']);

const editorContainer = ref(null);
const themeStore = useThemeStore();
let editorView = null;

// 去除 BOM 头
const stripBom = (text) =>
	text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

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
};

const jumpToNextError = () => {
	if (!editorView) return;
	nextDiagnostic(editorView);
	editorView.focus();
};

const expandAll = () => {
	if (editorView) unfoldAll(editorView);
};

const collapseAll = () => {
	if (editorView) {
		// 1. 强制解析完整语法树，确保所有节点都可以被折叠
		ensureSyntaxTree(editorView.state, editorView.state.doc.length, 5000);

		// 2. 使用 foldAll 递归折叠所有层级
		// foldAll 会正确处理嵌套结构，当展开外层时内层仍保持折叠状态
		foldAll(editorView);
	}
};

defineExpose({ jumpToNextError, expandAll, collapseAll });

// CodeEditor 特有的扩展配置（Lint、搜索、自动格式化）
const getCodeEditorExtensions = () => [
	search({ top: true }), // 搜索框在顶部
	lintGutter(),
	linter(jsonSyntaxLinter()), // JSON 语法检查
	EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			const newVal = update.state.doc.toString();
			emit('update:modelValue', newVal);
			emit('change', newVal);

			// 自动格式化：当粘贴到空文档时，自动进行格式化
			if (
				update.startState.doc.length === 0 &&
				update.transactions.some((tr) => tr.isUserEvent('input.paste'))
			) {
				setTimeout(() => {
					if (!editorView) return;
					const currentDoc = editorView.state.doc.toString();
					if (currentDoc.trim()) {
						try {
							const parsed = JSON.parse(currentDoc);
							const formatted = JSON.stringify(parsed, null, 2);
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
	}),
	EditorState.readOnly.of(props.readonly),
];

// 组装所有 Editor 扩展（使用共享配置 + CodeEditor 特有配置）
const getExtensions = (isDark) => {
	return getEditorExtensions(isDark, getCodeEditorExtensions());
};

const initEditor = () => {
	if (!editorContainer.value) return;

	const state = EditorState.create({
		doc: props.modelValue,
		extensions: getExtensions(themeStore.isDark),
	});

	editorView = new EditorView({
		state,
		parent: editorContainer.value,
	});
};

watch(
	() => props.modelValue,
	(newVal) => {
		if (editorView && newVal !== editorView.state.doc.toString()) {
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
		// Recreate editor to switch syntax highlighting (OneDark vs Default)
		const content = editorView.state.doc.toString();
		const selection = editorView.state.selection;

		editorView.destroy();

		const state = EditorState.create({
			doc: content,
			extensions: getExtensions(isDark),
			selection,
		});

		editorView = new EditorView({
			state,
			parent: editorContainer.value,
		});
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
			extensions: getExtensions(themeStore.isDark),
		});
		editorView = new EditorView({ state, parent: editorContainer.value });
	},
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
