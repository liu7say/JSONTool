<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { formatJsonText } from '../features/json/format';
import { sortJsonKeys } from '../features/json/sort';
import { jsonToTable, findArrayPaths } from '../features/json/table';
import {
	DocumentCopy,
	ScaleToOriginal,
	Operation,
	Rank,
	Grid,
	Back,
	Switch,
	Search as SearchIcon,
} from '@element-plus/icons-vue';
import CodeEditor from './CodeEditor.vue';

const props = defineProps({
	doc: {
		type: Object,
		required: true,
	},
	viewMode: {
		type: String, // 'code' | 'table' | 'diff'
		default: 'code',
	},
	selectedArrayPath: {
		type: String,
		default: '',
	},
});

const emit = defineEmits([
	'update:doc',
	'update:viewMode',
	'update:selectedArrayPath',
	'save',
]);

// --- Compare Logic ---
const compareContent = ref('');

// --- Table Logic ---

// Available paths
const availableArrayPaths = computed(() => {
	if (!props.doc || props.doc.parseError) return [];
	return findArrayPaths(props.doc.parsedValue);
});

// Selected Path Logic
const selectedPath = computed({
	get: () => props.selectedArrayPath,
	set: (val) => emit('update:selectedArrayPath', val),
});

// Auto-select first path if available and none selected
watch(
	availableArrayPaths,
	(paths) => {
		if (paths.length > 0 && !props.selectedArrayPath) {
			emit('update:selectedArrayPath', paths[0]);
		}
	},
	{ immediate: true }
);

// Raw Table Data
const rawTableData = computed(() => jsonToTable(props.doc, selectedPath.value));

// State for Table Features
const filterText = ref('');
const sortCol = ref(null);
const sortAsc = ref(true); // true = asc, false = desc
const colWidths = ref({}); // { colName: widthPx }

// Computed: Processed Data (Filter -> Sort)
const processedRows = computed(() => {
	const { rows, columns } = rawTableData.value;
	if (!rows) return [];

	let result = [...rows];

	// 1. Filter
	if (filterText.value.trim()) {
		const lowerFilter = filterText.value.toLowerCase();
		result = result.filter((row) => {
			// Check all visible columns
			return columns.some((col) =>
				String(row[col] || '')
					.toLowerCase()
					.includes(lowerFilter)
			);
		});
	}

	// 2. Sort
	if (sortCol.value) {
		const key = sortCol.value;
		const multiplier = sortAsc.value ? 1 : -1;

		result.sort((a, b) => {
			const valA = a[key] !== undefined ? a[key] : '';
			const valB = b[key] !== undefined ? b[key] : '';

			// Numeric Sort try
			const numA = Number(valA);
			const numB = Number(valB);
			if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
				return (numA - numB) * multiplier;
			}

			// String Sort
			return String(valA).localeCompare(String(valB)) * multiplier;
		});
	}

	return result;
});

// Actions
const handleSort = (col) => {
	if (sortCol.value === col) {
		sortAsc.value = !sortAsc.value; // Toggle
	} else {
		sortCol.value = col;
		sortAsc.value = true; // Default ASC
	}
};

// Column Resizing logic
const resizingCol = ref(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e, col) => {
	resizingCol.value = col;
	startX.value = e.pageX;
	const th = e.target.closest('th');
	startWidth.value = th.getBoundingClientRect().width;

	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('mouseup', onMouseUp);
	document.body.style.cursor = 'col-resize';
};

const onMouseMove = (e) => {
	if (!resizingCol.value) return;
	const diff = e.pageX - startX.value;
	const newWidth = Math.max(50, startWidth.value + diff); // Min 50px
	colWidths.value = { ...colWidths.value, [resizingCol.value]: newWidth };
};

const onMouseUp = () => {
	resizingCol.value = null;
	document.removeEventListener('mousemove', onMouseMove);
	document.removeEventListener('mouseup', onMouseUp);
	document.body.style.cursor = '';
};

// --- Editor Actions ---
const isSorting = ref(false);
const showLoader = ref(false);
const codeEditorRef = ref(null);

const inputText = computed({
	get: () => props.doc.sourceText || '',
	set: (val) => emit('update:doc', val),
});

const jumpToNextError = () => {
	if (!codeEditorRef.value || !codeEditorRef.value.jumpToNextError) return;
	codeEditorRef.value.jumpToNextError();
};

const applyFormat = () => {
	// Format Main Doc
	const { text, error } = formatJsonText(props.doc, { indent: 2 });
	if (!error && text) emit('update:doc', text);

	// Format Compare Doc
	if (props.viewMode === 'diff' && compareContent.value) {
		try {
			const parsed = JSON.parse(compareContent.value);
			const res = formatJsonText({ parsedValue: parsed }, { indent: 2 });
			if (!res.error && res.text) {
				compareContent.value = res.text;
			}
		} catch (e) {
			// Ignore parse error
		}
	}
};

const applyCompact = () => {
	// Compact Main Doc
	const { text, error } = formatJsonText(props.doc, { indent: 0 });
	if (!error && text) emit('update:doc', text);

	// Compact Compare Doc
	if (props.viewMode === 'diff' && compareContent.value) {
		try {
			const parsed = JSON.parse(compareContent.value);
			const res = formatJsonText({ parsedValue: parsed }, { indent: 0 });
			if (!res.error && res.text) {
				compareContent.value = res.text;
			}
		} catch (e) {
			// Ignore parse error
		}
	}
};

const applySort = () => {
	if (isSorting.value) return;
	isSorting.value = true;

	// Only show loader if task takes longer than 100ms
	const loaderTimer = setTimeout(() => {
		showLoader.value = true;
	}, 100);

	// Use nextTick -> setTimeout(0) to allow UI render cycle to start before heavy task
	setTimeout(() => {
		try {
			// Sort Main Doc
			const { text, error } = sortJsonKeys(props.doc, { indent: 2 });
			if (!error && text) emit('update:doc', text);

			// Sort Compare Doc
			if (props.viewMode === 'diff' && compareContent.value) {
				try {
					const parsed = JSON.parse(compareContent.value);
					const res = sortJsonKeys({ parsedValue: parsed }, { indent: 2 });
					if (!res.error && res.text) {
						compareContent.value = res.text;
					}
				} catch (e) {
					// Ignore parse error
				}
			}
		} finally {
			clearTimeout(loaderTimer);
			showLoader.value = false;
			isSorting.value = false;
		}
	}, 0);
};

const toggleTableMode = () => {
	emit('update:viewMode', props.viewMode === 'table' ? 'code' : 'table');
};

const toggleDiffMode = () => {
	emit('update:viewMode', props.viewMode === 'diff' ? 'code' : 'diff');
};
</script>

<template>
	<div class="json-editor">
		<!-- Toolbar -->
		<div class="toolbar f-acrylic">
			<div class="group">
				<button
					v-if="viewMode !== 'diff'"
					class="f-button small"
					:class="viewMode === 'table' ? 'primary' : 'subtle'"
					:disabled="
						viewMode !== 'table' && !String(doc.sourceText || '').trim()
					"
					@click="toggleTableMode">
					<component
						:is="viewMode === 'table' ? Back : Grid"
						style="width: 14px" />
					{{ viewMode === 'table' ? '返回' : '表格视图' }}
				</button>

				<button
					v-if="viewMode !== 'table'"
					class="f-button small"
					:class="viewMode === 'diff' ? 'primary' : 'subtle'"
					@click="toggleDiffMode">
					<component
						:is="viewMode === 'diff' ? Back : Switch"
						style="width: 14px" />
					{{ viewMode === 'diff' ? '退出对比' : '对比' }}
				</button>
				<template v-if="viewMode === 'code' || viewMode === 'diff'">
					<button
						class="f-button small subtle"
						@click="applyFormat"
						title="Format">
						<component :is="DocumentCopy" style="width: 14px" /> 格式化
					</button>
					<button
						class="f-button small subtle"
						@click="applyCompact"
						title="Compact">
						<component :is="ScaleToOriginal" style="width: 14px" /> 压缩
					</button>
					<button
						class="f-button small subtle"
						@click="applySort"
						title="Sort Keys">
						<component :is="Rank" style="width: 14px" /> 排序
					</button>
				</template>

				<button
					v-if="viewMode === 'code' && doc.parseError"
					class="f-button small error-btn"
					@click="jumpToNextError">
					跳到错误
				</button>
			</div>

			<div class="group">
				<button class="f-button small primary" @click="$emit('save')">
					<component :is="Operation" style="width: 14px" /> 保存快照
				</button>
			</div>
		</div>

		<!-- Main Area -->
		<div class="editor-main">
			<!-- TABLE MODE -->
			<div v-if="viewMode === 'table'" class="table-mode">
				<!-- Table Controls -->
				<div class="table-controls">
					<div class="path-select-wrapper">
						<label>数组路径:</label>
						<div class="f-select-container">
							<select v-model="selectedPath" class="f-select">
								<option
									v-for="path in availableArrayPaths"
									:key="path"
									:value="path">
									{{ path || '(顶层数组)' }}
								</option>
							</select>
						</div>
					</div>

					<div class="filter-wrapper">
						<div class="f-input-wrapper search-input">
							<component :is="SearchIcon" class="search-icon" />
							<input
								type="text"
								class="f-input"
								v-model="filterText"
								placeholder="搜索表格内容..." />
						</div>
					</div>
				</div>

				<!-- Table Body -->
				<div
					v-if="!selectedPath && availableArrayPaths.length > 0"
					class="empty-state">
					请选择一个数组字段
				</div>
				<div v-else-if="rawTableData.error" class="empty-state">
					{{ rawTableData.error }}
				</div>
				<div v-else class="f-table-container">
					<table class="f-table">
						<thead>
							<tr>
								<!-- Row Index Column -->
								<th class="index-col">#</th>
								<th
									v-for="col in rawTableData.columns"
									:key="col"
									class="sortable"
									:style="{
										width: colWidths[col] ? colWidths[col] + 'px' : 'auto',
									}"
									@click="handleSort(col)">
									<div class="th-content">
										<span>{{ col }}</span>
										<span v-if="sortCol === col" class="sort-indicator">
											{{ sortAsc ? '↑' : '↓' }}
										</span>
									</div>
									<div
										class="resizer"
										@click.stop
										@mousedown.stop="(e) => startResize(e, col)"></div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(row, idx) in processedRows" :key="row.__rowId">
								<td class="index-col">{{ idx + 1 }}</td>
								<td v-for="col in rawTableData.columns" :key="col">
									{{ row[col] !== undefined ? row[col] : '' }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- CODE / DIFF MODE -->
			<div
				v-else
				class="code-wrapper"
				:class="{ 'is-diff': viewMode === 'diff' }">
				<!-- Pane A (Main) -->
				<div class="editor-pane">
					<CodeEditor
						ref="codeEditorRef"
						v-model="inputText"
						@change="(val) => emit('update:doc', val)" />

					<div class="status-bar" :class="{ error: doc.parseError }">
						<span v-if="!String(doc.sourceText || '').trim()">请输入 JSON</span>
						<span v-else-if="doc.parseError">{{ doc.parseError }}</span>
						<span v-else
							>JSON 有效 • {{ (doc.sourceText || '').length }} 字符</span
						>
					</div>
				</div>

				<!-- Pane B (Compare) -->
				<div v-if="viewMode === 'diff'" class="editor-pane second-pane">
					<CodeEditor v-model="compareContent" />
					<div class="status-bar">
						<span v-if="!String(compareContent || '').trim()"
							>在此输入对比 JSON</span
						>
						<span v-else>{{ compareContent.length }} 字符</span>
					</div>
				</div>

				<!-- Global Loader for Code Wrapper -->
				<div v-if="showLoader" class="overlay-loader">
					<span>排序中...</span>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.json-editor {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.toolbar {
	height: 48px;
	border-bottom: 1px solid var(--f-border-subtle);
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	background-color: var(--f-bg-layer2);
}

.group {
	display: flex;
	gap: 8px;
	align-items: center;
}

.editor-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
	min-height: 0;
	background-color: var(--f-bg-base);
}

/* Table Mode Styles */
.table-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 0;
}

.table-controls {
	display: flex;
	gap: 16px;
	padding: 12px 16px;
	background-color: var(--f-bg-layer1);
	border-bottom: 1px solid var(--f-border-subtle);
	align-items: center;
}

.path-select-wrapper {
	display: flex;
	align-items: center;
	gap: 8px;

	label {
		font-size: 13px;
		color: var(--f-text-secondary);
	}

	.f-select-container {
		width: 200px;
	}
}

.filter-wrapper {
	flex: 1;
	display: flex;
	justify-content: flex-end;

	.search-input {
		width: 240px;
		position: relative;

		.search-icon {
			position: absolute;
			left: 8px;
			top: 50%;
			transform: translateY(-50%);
			width: 14px;
			color: var(--f-text-tertiary);
			pointer-events: none;
		}

		.f-input {
			padding-left: 28px;
		}
	}
}

/* Data Grid Styles (Fluent 2) */
.f-table-container {
	flex: 1;
	overflow: auto;
	background-color: var(--f-bg-layer1);
}

.f-table {
	border-collapse: separate;
	border-spacing: 0;
	width: 100%;
	font-size: 13px;
	table-layout: fixed;

	th {
		background-color: var(--f-bg-layer2);
		position: sticky;
		top: 0;
		z-index: 2;
		font-weight: 600;
		color: var(--f-text-secondary);
		border-bottom: 1px solid var(--f-border-default);
		border-right: 1px solid var(--f-border-subtle);
		padding: 0;
		user-select: none;

		&:hover {
			background-color: var(--f-bg-control-hover);
		}

		&.sortable {
			cursor: pointer;
		}

		.th-content {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 12px;
			width: 100%;
			overflow: hidden;
		}

		.resizer {
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			width: 4px;
			cursor: col-resize;
			opacity: 0;
			transition: opacity 0.2s;
			background-color: var(--f-brand-base);

			&:hover {
				opacity: 1;
			}
		}
	}

	td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--f-border-subtle);
		border-right: 1px solid var(--f-border-subtle);
		color: var(--f-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Zebra Striping */
	tr:nth-child(even) td {
		background-color: var(--f-bg-layer2);
	}
	tr:hover td {
		background-color: var(--f-bg-control-hover);
	}

	.index-col {
		width: 40px;
		text-align: center;
		color: var(--f-text-tertiary);
		font-variant-numeric: tabular-nums;
		background-color: var(--f-bg-layer2); /* Sticky left if needed */
	}
}

.empty-state {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--f-text-secondary);
	font-size: 14px;
}

/* Code Mode Wrappers */
.code-wrapper {
	flex: 1;
	position: relative;
	display: flex;
	flex-direction: column;
	min-height: 0;

	/* Diff Mode Support */
	&.is-diff {
		flex-direction: row;
	}
}

.editor-pane {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	min-width: 0;
	position: relative;

	&.second-pane {
		border-left: 1px solid var(--f-border-subtle);
	}
}

.status-bar {
	height: 24px;
	padding: 0 12px;
	font-size: 11px;
	display: flex;
	align-items: center;
	color: white;
	background-color: var(--f-brand-base);

	&.error {
		background-color: var(--f-color-error);
	}
}

.overlay-loader {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	z-index: 50;
}

.error-btn {
	background-color: var(--f-color-error) !important;
	color: white !important;
	border: none !important;

	&:hover {
		filter: brightness(0.9);
	}
}
</style>
