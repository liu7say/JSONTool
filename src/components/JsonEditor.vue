<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { formatJsonText } from '../features/json/format';
import { sortJsonKeys } from '../features/json/sort';
import { jsonToTable, findArrayPaths } from '../features/json/table';
import { Search as SearchIcon } from '@element-plus/icons-vue';
import CodeEditor from './CodeEditor.vue';
import DiffEditor from './DiffEditor.vue';

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
	compareContent: {
		type: String,
		default: '',
	},
});

const emit = defineEmits([
	'update:doc',
	'update:viewMode',
	'update:selectedArrayPath',
	'update:compareContent',
	'save',
]);

// --- 核心逻辑 ---

// --- 比较功能逻辑 ---
// 使用 computed 进行属性的双向绑定
const localCompareContent = computed({
	get: () => props.compareContent,
	set: (val) => emit('update:compareContent', val),
});

// --- 表格视图逻辑 ---

// 计算可用的数组路径（用于将 JSON 展平为表格）
const availableArrayPaths = computed(() => {
	if (!props.doc || props.doc.parseError) return [];
	return findArrayPaths(props.doc.parsedValue);
});

// 选中的数组路径
const selectedPath = computed({
	get: () => props.selectedArrayPath,
	set: (val) => emit('update:selectedArrayPath', val),
});

// 如果有可用路径且未选择，自动选中第一个
watch(
	availableArrayPaths,
	(paths) => {
		if (paths.length > 0 && !props.selectedArrayPath) {
			emit('update:selectedArrayPath', paths[0]);
		}
	},
	{ immediate: true }
);

// 原始表格数据
const rawTableData = computed(() => jsonToTable(props.doc, selectedPath.value));

// 表格功能状态
const filterText = ref('');
const sortCol = ref(null);
const sortAsc = ref(true); // true = 升序, false = 降序
const colWidths = ref({}); // { colName: widthPx }

// 计算属性：处理后的数据（先过滤 -> 再排序）
const processedRows = computed(() => {
	const { rows, columns } = rawTableData.value;
	if (!rows) return [];

	let result = [...rows];

	// 1. 过滤
	if (filterText.value.trim()) {
		const lowerFilter = filterText.value.toLowerCase();
		result = result.filter((row) => {
			// 检查所有可见列
			return columns.some((col) =>
				String(row[col] || '')
					.toLowerCase()
					.includes(lowerFilter)
			);
		});
	}

	// 2. 排序
	if (sortCol.value) {
		const key = sortCol.value;
		const multiplier = sortAsc.value ? 1 : -1;

		result.sort((a, b) => {
			const valA = a[key] !== undefined ? a[key] : '';
			const valB = b[key] !== undefined ? b[key] : '';

			// 尝试数值排序
			const numA = Number(valA);
			const numB = Number(valB);
			if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
				return (numA - numB) * multiplier;
			}

			// 字符串排序
			return String(valA).localeCompare(String(valB)) * multiplier;
		});
	}

	return result;
});

// 动作
const handleSort = (col) => {
	if (sortCol.value === col) {
		sortAsc.value = !sortAsc.value; // 切换
	} else {
		sortCol.value = col;
		sortAsc.value = true; // 默认升序
	}
};

// 列宽调整逻辑
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
	const newWidth = Math.max(50, startWidth.value + diff); // 最小 50px
	colWidths.value = { ...colWidths.value, [resizingCol.value]: newWidth };
};

const onMouseUp = () => {
	resizingCol.value = null;
	document.removeEventListener('mousemove', onMouseMove);
	document.removeEventListener('mouseup', onMouseUp);
	document.body.style.cursor = '';
};

// --- 编辑器操作 ---
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

const applyFormat = (options = {}) => {
	// 格式化主文档
	const { text, error } = formatJsonText(props.doc, { indent: 2, ...options });
	if (!error && text) emit('update:doc', text);

	// 格式化对比文档
	if (props.viewMode === 'diff' && localCompareContent.value) {
		try {
			const parsed = JSON.parse(localCompareContent.value);
			const res = formatJsonText({ parsedValue: parsed }, { indent: 2 });
			if (!res.error && res.text) {
				localCompareContent.value = res.text;
			}
		} catch (e) {
			// 忽略解析错误
		}
	}
};

const applyCompact = () => {
	// 压缩主文档
	const { text, error } = formatJsonText(props.doc, { indent: 0 });
	if (!error && text) emit('update:doc', text);

	// 压缩对比文档
	if (props.viewMode === 'diff' && localCompareContent.value) {
		try {
			const parsed = JSON.parse(localCompareContent.value);
			const res = formatJsonText({ parsedValue: parsed }, { indent: 0 });
			if (!res.error && res.text) {
				localCompareContent.value = res.text;
			}
		} catch (e) {
			// 忽略解析错误
		}
	}
};

const applySort = (options = {}) => {
	if (isSorting.value) return;
	isSorting.value = true;

	// 如果任务超过 100ms，仅显示加载器
	const loaderTimer = setTimeout(() => {
		showLoader.value = true;
	}, 100);

	// 使用 nextTick -> setTimeout(0) 让 UI 渲染周期先运行，避免阻塞
	setTimeout(() => {
		try {
			// 排序主文档
			const { text, error } = sortJsonKeys(props.doc, {
				indent: 2,
				...options,
			});
			if (!error && text) emit('update:doc', text);

			// 排序对比文档
			if (props.viewMode === 'diff' && localCompareContent.value) {
				try {
					const parsed = JSON.parse(localCompareContent.value);
					const res = sortJsonKeys(
						{ parsedValue: parsed },
						{ indent: 2, ...options }
					);
					if (!res.error && res.text) {
						localCompareContent.value = res.text;
					}
				} catch (e) {
					// 忽略解析错误
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

// 公开方法供父组件调用
defineExpose({
	applyFormat,
	applyCompact,
	applySort,
	toggleTableMode,
	toggleDiffMode,
	jumpToNextError,
	// 暴露一些只读状态可以帮助父组件控制按钮状态等
	isSorting: computed(() => isSorting.value),
});
</script>

<template>
	<div class="json-editor">
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
					v-if="
						!availableArrayPaths.includes(selectedPath) &&
						availableArrayPaths.length > 0
					"
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

			<!-- DIFF MODE -->
			<div v-else-if="viewMode === 'diff'" class="code-wrapper">
				<DiffEditor
					v-model:original="inputText"
					v-model:modified="localCompareContent" />
				<div v-if="showLoader" class="overlay-loader">
					<span>排序中...</span>
				</div>
			</div>

			<!-- CODE MODE -->
			<div v-else class="code-wrapper">
				<div class="editor-pane">
					<CodeEditor
						ref="codeEditorRef"
						v-model="inputText"
						@change="(val) => emit('update:doc', val)" />
				</div>
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

.editor-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
	min-height: 0;
	background-color: var(--f-bg-base);
}

/* 表格模式样式 */
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

/* 数据网格样式 (Fluent 2) */
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

	/* 斑马纹 */
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
		background-color: var(--f-bg-layer2); /* 如果需要，左侧固定 */
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

/* 代码模式包装器 */
.code-wrapper {
	flex: 1;
	position: relative;
	display: flex;
	flex-direction: column;
	min-height: 0;

	/* 对比模式支持 */
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
</style>
