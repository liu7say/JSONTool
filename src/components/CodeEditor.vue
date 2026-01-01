<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { lintGutter, linter, nextDiagnostic } from '@codemirror/lint';
import { search, searchKeymap } from '@codemirror/search';
import { useThemeStore } from '../stores/theme';

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

const emit = defineEmits(['update:modelValue', 'change']);

const editorContainer = ref(null);
const themeStore = useThemeStore();
let editorView = null;
let shouldResetToTopAfterPaste = false;

const stripBom = (text) =>
	text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

const getJsonErrorPosition = (errorMessage) => {
	const match = String(errorMessage || '').match(/position\s+(\d+)/i);
	if (!match) return null;
	const pos = Number(match[1]);
	return Number.isFinite(pos) ? pos : null;
};

const findNonWhitespaceBackward = (text, start) => {
	for (let i = Math.min(start, text.length - 1); i >= 0; i--) {
		if (!/\s/.test(text[i])) return i;
	}
	return 0;
};

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

	// 如果错误位置落在换行/空白，向前找到更“像错误点”的字符，避免高亮跑到下一行
	if (/\s/.test(original[pos])) {
		pos = findNonWhitespaceBackward(original, pos);
	}

	// 常见：缺逗号导致 "Unexpected string" 报在下一行的下一个 key 上（通常是引号）
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
		const message = error instanceof Error ? error.message : String(error);
		return buildJsonDiagnostics(original, message);
	}
};

const isFullDocumentSelection = (selection, docLength) => {
	if (!selection || !selection.ranges || selection.ranges.length !== 1)
		return false;
	const range = selection.ranges[0];
	return range.from === 0 && range.to === docLength;
};

const jumpToNextError = () => {
	if (!editorView) return;
	nextDiagnostic(editorView);
	editorView.focus();
};

defineExpose({ jumpToNextError });

// 基础扩展：JSON 语法 + 历史记录 + 快捷键
// 搜索框样式生成器
const getSearchTheme = (isDark) => {
	const colors = isDark
		? {
				bg: '#2d333b',
				border: '#444c56',
				text: '#c9d1d9',
				inputBg: '#22272e',
				inputBorder: '#444c56',
				buttonBg: '#373e47',
				buttonBorder: '#444c56',
				buttonHover: '#444c56',
				shadow: '0 4px 12px rgba(0,0,0,0.4)',
				closeHover: '#c9d1d9',
		  }
		: {
				bg: '#ffffff',
				border: '#e1e4e8',
				text: '#24292e',
				inputBg: '#ffffff',
				inputBorder: '#e1e4e8',
				buttonBg: '#f6f8fa',
				buttonBorder: '#d1d5da',
				buttonHover: '#eff2f5',
				shadow: '0 4px 12px rgba(0,0,0,0.1)',
				closeHover: '#24292e',
		  };

	return EditorView.theme({
		'&': { height: '100%', fontSize: '14px' }, // 稍微增大字体提升可读性
		'.cm-scroller': { overflow: 'auto', height: '100%' },

		// 搜索面板容器
		'.cm-panels': {
			backgroundColor: 'transparent',
			border: 'none',
			zIndex: '100',
		},
		'.cm-panels-top': {
			borderBottom: 'none',
		},

		// 搜索框主体
		'.cm-search': {
			fontFamily: 'inherit',
			fontSize: '14px',
			padding: '6px 10px',
			margin: '8px', // 悬浮感
			backgroundColor: colors.bg,
			color: colors.text,
			border: `1px solid ${colors.border}`,
			borderRadius: '6px',
			boxShadow: colors.shadow,
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			flexWrap: 'wrap',
			maxWidth: '100%',
		},

		// 输入框
		'.cm-search input': {
			fontSize: '13px',
			padding: '4px 8px',
			backgroundColor: colors.inputBg,
			border: `1px solid ${colors.inputBorder}`,
			borderRadius: '4px',
			outline: 'none',
			color: colors.text,
			minWidth: '120px',
		},
		'.cm-search input:focus': {
			borderColor: '#0366d6',
			boxShadow: '0 0 0 2px rgba(3, 102, 214, 0.3)',
		},

		// 复选框 Label
		'.cm-search label': {
			fontSize: '12px',
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			cursor: 'pointer',
			color: colors.text,
		},

		// 按钮通用
		'.cm-search button': {
			fontSize: '13px',
			padding: '3px 8px',
			backgroundColor: colors.buttonBg,
			border: `1px solid ${colors.buttonBorder}`,
			borderRadius: '4px',
			color: colors.text,
			cursor: 'pointer',
			transition: 'all 0.15s ease',
			textTransform: 'none', // 取消可能的默认大写
			margin: '0', // 覆盖默认
		},
		'.cm-search button:hover': {
			backgroundColor: colors.buttonHover,
			borderColor: colors.buttonBorder,
		},

		// 关闭按钮
		'.cm-search button[name="close"]': {
			position: 'absolute',
			top: '4px',
			right: '6px',
			padding: '0',
			width: '20px',
			height: '20px',
			borderRadius: '50%',
			border: 'none',
			background: 'transparent',
			fontSize: '16px',
			lineHeight: '1',
			color: '#999',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		},
		'.cm-search button[name="close"]:hover': {
			backgroundColor: 'transparent',
			color: colors.closeHover,
		},

		// 图标化按钮
		'.cm-search button[name="next"]': { minWidth: '28px' },
		'.cm-search button[name="next"]::before': { content: '"↓"' }, // 向下箭头
		'.cm-search button[name="prev"]': { minWidth: '28px' },
		'.cm-search button[name="prev"]::before': { content: '"↑"' }, // 向上箭头
		// 隐藏原始文字 (CodeMirror 默认可能有文字，设为 font-size 0 隐藏)
		'.cm-search button[name="next"], .cm-search button[name="prev"]': {
			color: 'transparent',
			position: 'relative',
			overflow: 'hidden',
		},
		'.cm-search button[name="next"]::before, .cm-search button[name="prev"]::before':
			{
				color: colors.text,
				position: 'absolute',
				left: '50%',
				top: '50%',
				transform: 'translate(-50%, -50%)',
				fontSize: '14px',
				fontWeight: 'bold',
			},

		// 文本按钮
		'.cm-search button[name="replace"], .cm-search button[name="replaceAll"], .cm-search button[name="select"]':
			{
				padding: '3px 10px',
			},
	});
};

// 基础扩展：JSON 语法 + 历史记录 + 快捷键
const getExtensions = (isDark) => {
	const extensions = [
		basicSetup,
		history(),
		keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
		json(),
		search({ top: true }),
		lintGutter(),
		linter(jsonSyntaxLinter()),
		EditorView.domEventHandlers({
			paste(event, view) {
				const docLength = view.state.doc.length;
				const isReplacingAll =
					docLength === 0 ||
					isFullDocumentSelection(view.state.selection, docLength);
				if (!isReplacingAll) return false;

				const pastedText = event.clipboardData?.getData('text/plain') || '';
				if (!pastedText) return false;

				shouldResetToTopAfterPaste = true;
				return false;
			},
		}),
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				const newVal = update.state.doc.toString();
				emit('update:modelValue', newVal);
				emit('change', newVal);

				if (shouldResetToTopAfterPaste) {
					shouldResetToTopAfterPaste = false;
					update.view.dispatch({ selection: { anchor: 0 } });
					update.view.scrollDOM.scrollTop = 0;
				}
			}
		}),
		EditorState.readOnly.of(props.readonly),
		// 注入新的搜索主题
		getSearchTheme(isDark),
	];

	if (isDark) {
		extensions.push(oneDark);
	} else {
		// Light theme (默认就是 Light，但可以加点微调)
		extensions.push(
			EditorView.theme({
				'&': { backgroundColor: '#ffffff', color: '#333' },
				'.cm-gutters': {
					backgroundColor: '#f5f5f5',
					color: '#ddd',
					borderRight: '1px solid #ddd',
				},
				'.cm-activeLineGutter': { backgroundColor: '#e8f2ff' },
			})
		);
	}

	return extensions;
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

// 监听外部 modelValue 变化（单向数据流同步）
watch(
	() => props.modelValue,
	(newVal) => {
		if (editorView && newVal !== editorView.state.doc.toString()) {
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: newVal },
			});
		}
	}
);

// 监听主题变化，重建扩展（这是最稳的方式，动态 reconfigure 也可以但容易漏）
watch(
	() => themeStore.isDark,
	(isDark) => {
		if (!editorView) return;
		// 保持当前内容和光标位置
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
	}
);

// 监听 readonly 变化
watch(
	() => props.readonly,
	(val) => {
		if (!editorView) return;
		// 重新注入扩展比较重，这里可以用 reconfigure 优化，但为了稳先重刷
		const content = editorView.state.doc.toString();
		editorView.destroy();
		const state = EditorState.create({
			doc: content,
			extensions: getExtensions(themeStore.isDark),
		});
		editorView = new EditorView({ state, parent: editorContainer.value });
	}
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
</style>
