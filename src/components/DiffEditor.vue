<script setup>
import { ref, onMounted, onBeforeUnmount, watch, toRefs, computed } from 'vue';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { MergeView } from '@codemirror/merge';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import {
	lineNumbers,
	highlightActiveLineGutter,
	highlightSpecialChars,
	drawSelection,
	dropCursor,
	rectangularSelection,
	crosshairCursor,
	highlightActiveLine,
	keymap,
} from '@codemirror/view';
import {
	defaultHighlightStyle,
	syntaxHighlighting,
	indentOnInput,
	bracketMatching,
	foldKeymap,
	foldAll,
	unfoldAll,
	ensureSyntaxTree,
	syntaxTree,
	foldCode,
} from '@codemirror/language';
import { EditorSelection } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { closeBrackets, autocompletion } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';

import { useThemeStore } from '../stores/theme';
import { fluentTheme } from '../features/codemirror/fluent-theme';
import { fluentFoldGutter } from '../features/codemirror/fluent-fold';

const props = defineProps({
	original: {
		type: String,
		default: '',
	},
	modified: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['update:original', 'update:modified']);

const containerRef = ref(null);
const themeStore = useThemeStore();
let mergeView = null;
const lastEmittedOriginal = ref(null);
const lastEmittedModified = ref(null);
const diffCount = ref(0);

// 定制搜索面板的本地化词条
const editorPhrases = {
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

const pasteTransactionFilter = EditorState.transactionFilter.of((tr) => {
	if (tr.isUserEvent('input.paste')) {
		let minFrom = Infinity;
		tr.changes.iterChanges((fromA, toA, fromB, toB) => {
			if (fromB < minFrom) minFrom = fromB; // 记录粘贴开始的位置
		});

		if (minFrom !== Infinity) {
			return [
				tr,
				{
					selection: { anchor: minFrom }, // 强制光标停留在粘贴开始处
					scrollIntoView: true,
				},
			];
		}
	}
	return tr;
});

// 复用 CodeEditor 的基础配置
const commonExtensions = [
	EditorState.phrases.of(editorPhrases), // 本地化
	lineNumbers(),
	highlightActiveLineGutter(),
	highlightSpecialChars(),
	history(),
	fluentFoldGutter,
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
	]),
	json(),
	fluentTheme,
	pasteTransactionFilter, // 核心修复：添加粘贴行为控制
];

const getExtensions = (isDark) => {
	const extensions = [...commonExtensions];
	if (isDark) {
		extensions.push(oneDark);
	}
	return extensions;
};

const initMergeView = () => {
	if (!containerRef.value) return;

	// 销毁旧实例
	if (mergeView) {
		mergeView.destroy();
	}

	mergeView = new MergeView({
		a: {
			doc: props.original,
			extensions: [
				...getExtensions(themeStore.isDark),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const val = update.state.doc.toString();
						lastEmittedOriginal.value = val;
						emit('update:original', val);
					}
					// 每次更新都检查差异数量
					if (mergeView && mergeView.chunks) {
						diffCount.value = mergeView.chunks.length;
					}
				}),
			],
		},
		b: {
			doc: props.modified,
			extensions: [
				...getExtensions(themeStore.isDark),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const val = update.state.doc.toString();
						lastEmittedModified.value = val;
						emit('update:modified', val);
					}
					// 每次更新都检查差异数量
					if (mergeView && mergeView.chunks) {
						diffCount.value = mergeView.chunks.length;
					}
				}),
			],
		},
		parent: containerRef.value,
		gutter: true,
		highlightChanges: true,
		collapseContent: false,
	});

	// 初始化时也检查一次
	if (mergeView && mergeView.chunks) {
		diffCount.value = mergeView.chunks.length;
	}
};

// 监听 props 变化同步到编辑器
watch(
	() => props.original,
	(newVal) => {
		if (mergeView) {
			if (newVal === lastEmittedOriginal.value) return;
			const current = mergeView.a.state.doc.toString();
			if (newVal !== current) {
				mergeView.a.dispatch({
					changes: { from: 0, to: current.length, insert: newVal },
				});
			}
		}
	},
);

watch(
	() => props.modified,
	(newVal) => {
		if (mergeView) {
			if (newVal === lastEmittedModified.value) return;
			const current = mergeView.b.state.doc.toString();
			if (newVal !== current) {
				mergeView.b.dispatch({
					changes: { from: 0, to: current.length, insert: newVal },
				});
			}
		}
	},
);

// 监听主题变化
watch(
	() => themeStore.isDark,
	() => {
		// MergeView 比较复杂，通常建议重建
		initMergeView();
	},
);

onMounted(() => {
	initMergeView();
});

onBeforeUnmount(() => {
	if (mergeView) {
		mergeView.destroy();
	}
});

const expandAll = () => {
	if (mergeView) {
		unfoldAll(mergeView.a);
		unfoldAll(mergeView.b);
	}
};

const collapseAll = () => {
	if (mergeView) {
		// 左侧
		ensureSyntaxTree(mergeView.a.state, mergeView.a.state.doc.length, 5000);
		foldAll(mergeView.a);

		// 右侧
		ensureSyntaxTree(mergeView.b.state, mergeView.b.state.doc.length, 5000);
		foldAll(mergeView.b);
	}
};

const nextDiff = () => {
	if (!mergeView) return;

	// 尝试获取差异块
	// CodeMirror MergeView 实例通常维护 chunks，或是可以通过 API 获取
	// 这里假设 mergeView.chunks 可用，或者是核心 API 的一部分
	let chunks = mergeView.chunks;

	// 如果 API 有变动拿不到 chunks，这里可以做一个简单的回退（虽然不完美）
	// 但通常 mergeView.chunks 是存在的（数组包含 { fromA, toA, fromB, toB }）
	if (!chunks) return;

	const currentPos = mergeView.a.state.selection.main.head;

	// 找到当前光标之后的第一个差异块
	let nextChunk = chunks.find((c) => c.fromA > currentPos);

	// 如果后面没有了，并且确实有差异，可以循环回到第一个（可选，为了体验通常会回滚到开头）
	if (!nextChunk && chunks.length > 0) {
		nextChunk = chunks[0];
	}

	if (nextChunk) {
		// 移动光标并滚动
		mergeView.a.dispatch({
			selection: { anchor: nextChunk.fromA },
			scrollIntoView: true,
			effects: EditorView.scrollIntoView(nextChunk.fromA, { y: 'center' }), // 居中显示
		});
		mergeView.a.focus();
	}
};

defineExpose({
	expandAll,
	collapseAll,
	nextDiff,
	diffCount: computed(() => diffCount.value),
});
</script>

<template>
	<div class="diff-editor-container" ref="containerRef"></div>
</template>

<style lang="scss" scoped>
.diff-editor-container {
	height: 100%;
	width: 100%;
	overflow: hidden;
	font-size: 13px;

	:deep(.cm-mergeView) {
		height: 100%;

		.cm-mergeViewEditors {
			display: flex;
			align-items: stretch;
		}

		.cm-editor {
			height: 100%;
		}

		.cm-scroller {
			overflow: auto;
		}
	}

	/* 自定义一些连线颜色适配 Fluent 主题 */
	:deep(.cm-merge-gutter) {
		background-color: var(--f-bg-layer1);
	}

	/* 强制覆盖搜索框样式，使其在 Merge View 中也能正确浮动 */
	:deep(.cm-panels),
	:deep(.cm-panels-bottom) {
		position: absolute !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: auto !important;
		background: transparent !important;
		border: none !important;
		pointer-events: none !important; /* 避免遮挡编辑器点击 */
		z-index: 200 !important;
	}

	:deep(.cm-editor .cm-search) {
		position: absolute !important;
		top: 12px !important;
		right: 24px !important;
		pointer-events: auto !important; /* 恢复搜索框交互 */
	}

	/* 自定义差异颜色覆盖 */
	/* 左侧 (Original/Deleted/Changed) */
	:deep(.cm-merge-a .cm-changedLine),
	:deep(.cm-merge-a .cm-deletedChunk) {
		background-color: #a0646436 !important;
	}
	:deep(.cm-merge-a .cm-changedLineGutter),
	:deep(.cm-merge-a .cm-deletedLineGutter) {
		background-color: #a0646436 !important;
	}

	/* 右侧 (Modified/Inserted/Changed) */
	:deep(.cm-merge-b .cm-changedLine),
	:deep(.cm-merge-b .cm-insertedChunk) {
		background-color: #55ab7d38 !important;
	}
	:deep(.cm-merge-b .cm-changedLineGutter),
	:deep(.cm-merge-b .cm-insertedLineGutter) {
		background-color: #55ab7d38 !important;
	}
}
</style>
