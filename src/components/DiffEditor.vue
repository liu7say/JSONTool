<script setup>
import { ref, onMounted, onBeforeUnmount, watch, toRefs } from 'vue';
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
} from '@codemirror/language';
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
			extensions: getExtensions(themeStore.isDark),
		},
		b: {
			doc: props.modified,
			extensions: [
				...getExtensions(themeStore.isDark),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						emit('update:modified', update.state.doc.toString());
					}
				}),
			],
		},
		parent: containerRef.value,
		gutter: true,
		highlightChanges: true,
		collapseContent: false, // 保持展开以便查看
	});

	// 监听左侧(a)的变化也同步回去 (如果允许双向编辑)
	// 目前 CodeMirror MergeView 的 'a' 文档更新需要单独处理
	// 我们可以给 'a' 也加上 updateListener
	const leftDispatch = mergeView.a.dispatch;
	// 这是一个 hack 方式，或者重新配置 extensions
	// 更好的方式是在初始化时就加上
	// 上面的配置里 a 的 extensions 是静态的，重新构建一下:

	// Re-init with correct listeners
	mergeView.destroy();
	mergeView = new MergeView({
		a: {
			doc: props.original,
			extensions: [
				...getExtensions(themeStore.isDark),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						emit('update:original', update.state.doc.toString());
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
						emit('update:modified', update.state.doc.toString());
					}
				}),
			],
		},
		parent: containerRef.value,
		gutter: true,
		highlightChanges: true,
		collapseContent: false,
	});
};

// 监听 props 变化同步到编辑器
watch(
	() => props.original,
	(newVal) => {
		if (mergeView) {
			const current = mergeView.a.state.doc.toString();
			if (newVal !== current) {
				mergeView.a.dispatch({
					changes: { from: 0, to: current.length, insert: newVal },
				});
			}
		}
	}
);

watch(
	() => props.modified,
	(newVal) => {
		if (mergeView) {
			const current = mergeView.b.state.doc.toString();
			if (newVal !== current) {
				mergeView.b.dispatch({
					changes: { from: 0, to: current.length, insert: newVal },
				});
			}
		}
	}
);

// 监听主题变化
watch(
	() => themeStore.isDark,
	() => {
		// MergeView 比较复杂，通常建议重建
		initMergeView();
	}
);

onMounted(() => {
	initMergeView();
});

onBeforeUnmount(() => {
	if (mergeView) {
		mergeView.destroy();
	}
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
}
</style>
