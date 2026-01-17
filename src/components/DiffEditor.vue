<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { EditorView } from 'codemirror';
import { MergeView } from '@codemirror/merge';
import { foldAll, unfoldAll, ensureSyntaxTree } from '@codemirror/language';

import { useThemeStore } from '../stores/theme';
import { getEditorExtensions } from '../features/codemirror/editor-config';

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

// DiffEditor 特有的扩展配置生成器
const getDiffEditorExtensions = (isDark) => {
	return getEditorExtensions(isDark);
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
				...getDiffEditorExtensions(themeStore.isDark),
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
				...getDiffEditorExtensions(themeStore.isDark),
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
			height: 100% !important;
		}

		.cm-editor {
			height: 100% !important;
		}

		/* 确保滚动容器占满高度，空内容时编辑器也能占满可视区域 */
		.cm-scroller {
			overflow: auto;
			height: 100% !important;
		}

		.cm-content {
			min-height: 100% !important;
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
