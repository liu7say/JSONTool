<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { lintGutter, linter, nextDiagnostic } from '@codemirror/lint';
import { search, searchKeymap } from '@codemirror/search';

// Core Extensions (Splitting basicSetup)
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

import { useThemeStore } from '../stores/theme';
import { fluentTheme } from '../features/codemirror/fluent-theme';
import { fluentFoldGutter } from '../features/codemirror/fluent-fold';

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

	if (/\s/.test(original[pos])) {
		pos = findNonWhitespaceBackward(original, pos);
	}

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

const jumpToNextError = () => {
	if (!editorView) return;
	nextDiagnostic(editorView);
	editorView.focus();
};

defineExpose({ jumpToNextError });

// Localization Phrases
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

// Custom Basic Setup + Fluent Fold
const customBasicSetup = [
	lineNumbers(),
	highlightActiveLineGutter(),
	highlightSpecialChars(),
	history(),
	fluentFoldGutter, // Custom Fold Gutter
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
];

// Paste handler: Keep cursor at start of paste
const pasteTransactionFilter = EditorState.transactionFilter.of((tr) => {
	if (tr.isUserEvent('input.paste')) {
		// Calculate where the changes happened
		let minFrom = Infinity;
		tr.changes.iterChanges((fromA, toA, fromB, toB) => {
			if (fromB < minFrom) minFrom = fromB;
		});

		if (minFrom !== Infinity) {
			// Force selection to start of paste
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

// Fluent Theme extensions
const getExtensions = (isDark) => {
	const extensions = [
		EditorState.phrases.of(editorPhrases), // Localization
		...customBasicSetup, // Use customized setup
		json(),
		search({ top: true }),
		lintGutter(),
		linter(jsonSyntaxLinter()),
		pasteTransactionFilter, // Inject our paste handler
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				const newVal = update.state.doc.toString();
				emit('update:modelValue', newVal);
				emit('change', newVal);
			}
		}),
		EditorState.readOnly.of(props.readonly),
		fluentTheme,
	];

	if (isDark) {
		extensions.push(oneDark);
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
	}
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
