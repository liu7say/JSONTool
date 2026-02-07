<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch, computed } from 'vue';
import { useSessionStore } from './stores/session';
import { useHistoryStore } from './stores/history';
import { useThemeStore } from './stores/theme';
import { useSettingsStore } from './stores/settings';
import JsonEditor from './components/JsonEditor.vue';
import GithubIconUrl from './assets/github.svg';
import FButton from './components/FButton.vue';
import Logo from './components/Logo.vue';
import {
	Plus,
	Close,
	Clock,
	Delete,
	Moon,
	Sunny,
	Operation,
	DocumentCopy,
	ScaleToOriginal,
	Rank,
	Grid,
	Back,
	Switch,
	ArrowLeft,
	ArrowRight,
	ArrowDown,
	Check,
	Expand,
	Fold,
	Link,
	Unlock,
} from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

// 状态管理 stores
const sessionStore = useSessionStore();
const historyStore = useHistoryStore();
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();

// UI 状态 refs
const showHistory = ref(false); // 控制历史记录抽屉的显示
const jsonEditorRef = ref(null); // JsonEditor 实例引用
const showSortMenu = ref(false);
const sortButtonRef = ref(null);
const sortMenuRef = ref(null);

const showFormatMenu = ref(false);
const formatButtonRef = ref(null);
const formatMenuRef = ref(null);

// 动画和提示状态
const historyButtonAnimate = ref(false);
const toastVisible = ref(false);
const toastMessage = ref('');
let toastTimer = null;

// 点击外部关闭菜单
const handleClickOutside = (e) => {
	// 排序菜单
	if (
		showSortMenu.value &&
		sortButtonRef.value &&
		!sortButtonRef.value.contains(e.target) &&
		sortMenuRef.value &&
		!sortMenuRef.value.contains(e.target)
	) {
		showSortMenu.value = false;
	}
	// 格式化菜单
	if (
		showFormatMenu.value &&
		formatButtonRef.value &&
		!formatButtonRef.value.contains(e.target) &&
		formatMenuRef.value &&
		!formatMenuRef.value.contains(e.target)
	) {
		showFormatMenu.value = false;
	}
};

// 全局快捷键处理
const handleGlobalKeydown = (e) => {
	// Ctrl+S (Windows) 或 Cmd+S (Mac)
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
		e.preventDefault();
		if (sessionStore.activeTab) {
			onSaveHistory(sessionStore.activeTab);
		}
	}
};

onMounted(() => {
	window.addEventListener('click', handleClickOutside);
	settingsStore.loadSettings();

	if (sessionStore.tabs.length === 0) {
		sessionStore.createTab();
	}
	historyStore.loadIndex();
	window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
	window.removeEventListener('click', handleClickOutside);
	window.removeEventListener('keydown', handleGlobalKeydown);
});

/**
 * 处理文档更新事件
 * @param {string} id - Tab ID
 * @param {string} text - 新的文本内容
 */
const onUpdateDoc = (id, text) => {
	sessionStore.updateTabDoc(id, text);
};

/**
 * 处理视图模式更新事件 (code/tree/table)
 * @param {string} id - Tab ID
 * @param {string} mode - 新的视图模式
 */
const onUpdateViewMode = (id, mode) => {
	sessionStore.updateTabViewMode(id, mode);
};

/**
 * 处理 JSON 路径选择更新
 * @param {string} id - Tab ID
 * @param {string} path - JSON 路径
 */
const onUpdateArrayPath = (id, path) => {
	sessionStore.updateTabArrayPath(id, path);
};

const onUpdateCompareContent = (id, text) => {
	sessionStore.updateTabCompareContent(id, text);
};

/**
 * 保存当前快照到历史记录
 * @param {Object} tab - 当前 Tab 对象
 */
const onSaveHistory = async (tab) => {
	try {
		await historyStore.saveEntry({
			doc: { ...tab.doc, parsedValue: null }, // 不保存解析后的值，只保存源码
			toolState: { viewMode: tab.viewMode },
			title: tab.title || '未命名快照',
		});

		// 触发按钮动画
		historyButtonAnimate.value = true;
		setTimeout(() => {
			historyButtonAnimate.value = false;
		}, 300);

		// 显示提示
		if (toastTimer) clearTimeout(toastTimer);
		toastMessage.value = '已保存当前标签页快照';
		toastVisible.value = true;
		toastTimer = setTimeout(() => {
			toastVisible.value = false;
		}, 2000);
	} catch (e) {
		console.error(e);
	}
};

/**
 * 加载历史记录条目
 * @param {Object} entry - 历史记录条目
 */
const loadHistoryEntry = async (entry) => {
	const data = await historyStore.loadEntry(entry.id);
	if (data && data.doc) {
		const tab = sessionStore.createTab(data.doc.sourceText);
		tab.title = entry.title || tab.title;
		if (data.toolState?.viewMode) {
			tab.viewMode =
				data.toolState.viewMode === 'format' ? 'code' : data.toolState.viewMode;
		}
		showHistory.value = false;
	}
};

// --- 编辑器操作代理方法 ---
const triggerFormat = () => {
	const currentIndent = settingsStore.indent;
	if (currentIndent === 'jsObj') {
		jsonEditorRef.value?.applyFormat({ indent: 2, format: 'jsObj' });
	} else {
		jsonEditorRef.value?.applyFormat({ indent: currentIndent, format: 'json' });
	}
};

const setFormatIndent = (indent) => {
	settingsStore.indent = indent;
	triggerFormat();
	showFormatMenu.value = false;
};
const triggerCompact = () => jsonEditorRef.value?.applyCompact();
const triggerEscape = () => jsonEditorRef.value?.applyEscape();
const triggerUnescape = () => jsonEditorRef.value?.applyUnescape();

const triggerSort = () => {
	jsonEditorRef.value?.applySort({
		structureAtEnd: settingsStore.sortStructureAtEnd,
	});
	showSortMenu.value = false;
};

const toggleSortStructureAtEnd = () => {
	settingsStore.sortStructureAtEnd = !settingsStore.sortStructureAtEnd;
	triggerSort();
};
const triggerToggleTableRaw = () => jsonEditorRef.value?.toggleTableMode();
const triggerToggleDiff = () => jsonEditorRef.value?.toggleDiffMode();
const triggerNextError = () => jsonEditorRef.value?.jumpToNextError();
const triggerExpandAll = () => jsonEditorRef.value?.expandAll();
const triggerCollapseAll = () => jsonEditorRef.value?.collapseAll();
const triggerNextDiff = () => jsonEditorRef.value?.nextDiff();

// --- 侧边栏 Hover Popover 逻辑 ---
const hoveredTabId = ref(null);
const popoverStyle = ref({ top: '0px', left: '0px', width: '200px' });
let hoverTimer = null;

const getShortTitle = (title) => {
	if (!title) return '';
	// 返回第一个字符（如果需要处理代理对，但简单的索引目前就够了）
	return String(title).substring(0, 1).toUpperCase();
};

// 拖拽排序用的计算属性
const tabsList = computed({
	get: () => sessionStore.tabs,
	set: (value) => {
		sessionStore.tabs = value;
	},
});

const onTabMouseEnter = (e, tabId) => {
	if (!sessionStore.sidebarCollapsed) {
		hoveredTabId.value = null;
		return;
	}

	const target = e.currentTarget;
	const rect = target.getBoundingClientRect();

	// 设置位置：直接对齐折叠的标签页，但宽度展开
	popoverStyle.value = {
		top: rect.top + 'px',
		left: rect.left + 'px',
		width: '200px', // 固定展开宽度
	};

	hoveredTabId.value = tabId;

	if (hoverTimer) clearTimeout(hoverTimer);
};

const onTabMouseLeave = (e) => {
	// 如果移动到弹出框，不关闭
	if (
		e.relatedTarget &&
		e.relatedTarget.closest &&
		e.relatedTarget.closest('.tab-popover')
	) {
		return;
	}

	hoverTimer = setTimeout(() => {
		hoveredTabId.value = null;
	}, 100);
};

const onPopoverMouseEnter = () => {
	if (hoverTimer) clearTimeout(hoverTimer);
};

const onPopoverMouseLeave = (e) => {
	// 如果移回侧边栏标签页，允许标签页的 mouseenter 处理它（通过清除定时器）
	// 但我们仍然在这里设置定时器，以防我们移动到空白处

	hoverTimer = setTimeout(() => {
		hoveredTabId.value = null;
	}, 100);
};

// 辅助计算属性
const activeTab = computed(() => sessionStore.activeTab);
const hoveredTab = computed(() =>
	sessionStore.tabs.find((t) => t.id === hoveredTabId.value),
);

// 状态栏信息
const statusBarInfo = computed(() => {
	if (!activeTab.value) return { text: '就绪', isError: false };

	const tab = activeTab.value;
	const doc = tab.doc;

	if (tab.viewMode === 'table') {
		const path = tab.selectedArrayPath || '(顶层)';
		return { text: `表格模式 • 路径: ${path}`, isError: false };
	}

	if (tab.viewMode === 'diff') {
		// Diff 模式显示对比信息
		const mainLen = (doc.sourceText || '').length;
		const compareLen = (tab.compareContent || '').length;
		return {
			text: `对比模式 • 主文档: ${mainLen} 字符 • 对比文档: ${compareLen} 字符`,
			isError: false,
		};
	}

	// 代码模式
	if (!String(doc.sourceText || '').trim()) {
		return { text: '请输入 JSON', isError: false };
	}

	if (doc.parseError) {
		return { text: doc.parseError, isError: true };
	}

	return {
		text: `JSON 有效 • ${doc.sourceText.length} 字符`,
		isError: false,
	};
});

/**
 * 处理带有视图转换（波纹效果）的主题切换
 */
const handleThemeToggle = (event) => {
	// 针对不支持 View Transitions 的浏览器的回退
	if (!document.startViewTransition) {
		themeStore.toggle();
		return;
	}

	// 获取点击位置
	const x = event.clientX;
	const y = event.clientY;

	// 计算到最远角落的半径
	const endRadius = Math.hypot(
		Math.max(x, innerWidth - x),
		Math.max(y, innerHeight - y),
	);

	// 开始视图转换
	const transition = document.startViewTransition(async () => {
		await themeStore.toggle();
		await nextTick(); // 确保 DOM 更新
	});

	// 动画 clip-path
	transition.ready.then(() => {
		const clipPath = [
			`circle(0px at ${x}px ${y}px)`,
			`circle(${endRadius}px at ${x}px ${y}px)`,
		];
		document.documentElement.animate(
			{
				clipPath: clipPath,
			},
			{
				duration: 800,
				easing: 'ease-in-out',
				pseudoElement: '::view-transition-new(root)',
			},
		);
	});
};
</script>

<template>
	<div class="app-container">
		<!-- 顶部统一 Header (Logo + Tools) -->
		<div class="header f-acrylic">
			<div
				class="brand"
				:style="{
					width: sessionStore.sidebarCollapsed ? '48px' : '140px',
					overflow: 'hidden',
				}">
				<Logo :collapsed="sessionStore.sidebarCollapsed" />
			</div>

			<div class="header-content">
				<!-- 左侧：编辑器工具组 -->
				<div class="toolbar-group left" v-if="activeTab">
					<!-- 视图切换 -->
					<div class="tool-section">
						<div class="f-button-group">
							<FButton
								v-if="activeTab.viewMode !== 'diff'"
								size="small"
								:type="activeTab.viewMode === 'table' ? 'primary' : 'subtle'"
								:disabled="
									activeTab.viewMode !== 'table' &&
									!String(activeTab.doc.sourceText || '').trim()
								"
								@click="triggerToggleTableRaw">
								<component
									:is="activeTab.viewMode === 'table' ? Back : Grid"
									style="width: 14px" />
								{{ activeTab.viewMode === 'table' ? '返回' : '表格视图' }}
							</FButton>

							<FButton
								v-if="activeTab.viewMode !== 'table'"
								size="small"
								:type="activeTab.viewMode === 'diff' ? 'primary' : 'subtle'"
								:disabled="
									activeTab.viewMode !== 'diff' &&
									!String(activeTab.doc.sourceText || '').trim()
								"
								@click="triggerToggleDiff">
								<component
									:is="activeTab.viewMode === 'diff' ? Back : Switch"
									style="width: 14px" />
								{{ activeTab.viewMode === 'diff' ? '退出对比' : '对比' }}
							</FButton>
						</div>

						<div
							class="f-button-group"
							v-if="
								activeTab.viewMode === 'diff' &&
								jsonEditorRef &&
								jsonEditorRef.diffCount > 0 &&
								String(activeTab.doc.sourceText || '').trim() &&
								String(activeTab.compareContent || '').trim()
							">
							<FButton
								size="small"
								type="danger"
								@click="triggerNextDiff"
								title="跳转到下一个差异">
								下一个差异 <component :is="ArrowRight" style="width: 14px" />
							</FButton>
						</div>
					</div>

					<!-- 错误跳转 (仅 Code 模式) -->
					<div
						class="tool-section"
						v-if="activeTab.viewMode === 'code' && activeTab.doc.parseError">
						<FButton size="small" type="danger" @click="triggerNextError">
							跳到错误
						</FButton>
					</div>

					<!-- 格式化工具 (Code/Diff 模式) -->
					<div
						class="tool-section"
						v-if="
							activeTab.viewMode === 'code' || activeTab.viewMode === 'diff'
						">
						<div class="f-button-group" ref="formatButtonRef">
							<FButton
								size="small"
								type="subtle"
								class="group-left"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerFormat"
								title="Format">
								<component :is="DocumentCopy" style="width: 14px" /> 格式化
							</FButton>
							<FButton
								size="small"
								type="subtle"
								class="group-right"
								icon-only
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click.stop="showFormatMenu = !showFormatMenu"
								title="格式化选项">
								<component :is="ArrowDown" style="width: 12px; height: 12px" />
							</FButton>

							<!-- 下拉菜单 -->
							<transition name="fade-scale">
								<div
									v-if="showFormatMenu"
									class="f-popover-menu"
									ref="formatMenuRef">
									<div class="menu-item" @click="setFormatIndent(2)">
										<span>2 空格</span>
										<div class="check-box">
											<component
												v-if="settingsStore.indent === 2"
												:is="Check"
												style="width: 12px" />
										</div>
									</div>
									<div class="menu-item" @click="setFormatIndent(4)">
										<span>4 空格</span>
										<div class="check-box">
											<component
												v-if="settingsStore.indent === 4"
												:is="Check"
												style="width: 12px" />
										</div>
									</div>
									<!-- <div class="menu-item" @click="setFormatIndent('\t')">
										<span>Tab 缩进</span>
										<div class="check-box">
											<component
												v-if="settingsStore.indent === '\t'"
												:is="Check"
												style="width: 12px" />
										</div>
									</div> -->
									<div class="menu-item" @click="setFormatIndent('jsObj')">
										<span>JS Object</span>
										<div class="check-box">
											<component
												v-if="settingsStore.indent === 'jsObj'"
												:is="Check"
												style="width: 12px" />
										</div>
									</div>
								</div>
							</transition>
						</div>
						<div class="f-button-group">
							<FButton
								size="small"
								type="subtle"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerEscape"
								title="将内容转义为 JSON 字符串">
								<component :is="Link" style="width: 14px" /> 转义
							</FButton>
							<FButton
								size="small"
								type="subtle"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerUnescape"
								title="去除 JSON 字符串转义">
								<component :is="Unlock" style="width: 14px" /> 去转义
							</FButton>
						</div>
						<div class="f-button-group">
							<FButton
								size="small"
								type="subtle"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerCompact"
								title="Compact">
								<component :is="ScaleToOriginal" style="width: 14px" /> 压缩
							</FButton>
						</div>
						<!-- 排序按钮组 (带下拉) -->
						<div class="f-button-group" ref="sortButtonRef">
							<FButton
								size="small"
								type="subtle"
								class="group-left"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerSort"
								title="按 Keys 排序">
								<component :is="Rank" style="width: 14px" /> 排序
							</FButton>
							<FButton
								size="small"
								type="subtle"
								class="group-right"
								icon-only
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click.stop="showSortMenu = !showSortMenu"
								title="排序选项">
								<component :is="ArrowDown" style="width: 12px; height: 12px" />
							</FButton>

							<!-- 下拉菜单 -->
							<transition name="fade-scale">
								<div
									v-if="showSortMenu"
									class="f-popover-menu"
									ref="sortMenuRef">
									<div class="menu-item" @click="toggleSortStructureAtEnd">
										<span>结构类型在后</span>
										<div class="check-box">
											<component
												v-if="settingsStore.sortStructureAtEnd"
												:is="Check"
												style="width: 12px" />
										</div>
									</div>
								</div>
							</transition>
						</div>

						<div class="f-button-group">
							<FButton
								size="small"
								type="subtle"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerExpandAll"
								title="全部展开">
								<component :is="Expand" style="width: 14px" />
							</FButton>
							<FButton
								size="small"
								type="subtle"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerCollapseAll"
								title="全部收起">
								<component :is="Fold" style="width: 14px" />
							</FButton>
						</div>
					</div>
				</div>
				<div class="toolbar-group left" v-else></div>

				<!-- 右侧：全局操作组 -->
				<div class="toolbar-group right">
					<FButton
						v-if="activeTab"
						size="small"
						type="primary"
						@click="onSaveHistory(activeTab)"
						title="只会保存当前标签页的快照">
						<component :is="Operation" style="width: 14px" /> 保存快照
					</FButton>

					<FButton
						size="small"
						type="subtle"
						icon-only
						@click="showHistory = true"
						:class="{ 'bump-animation': historyButtonAnimate }"
						title="历史记录">
						<component :is="Clock" style="width: 16px" />
					</FButton>

					<FButton
						size="small"
						type="subtle"
						icon-only
						@click="handleThemeToggle"
						:title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'">
						<component
							:is="themeStore.isDark ? Moon : Sunny"
							style="width: 16px" />
					</FButton>

					<a
						class="f-button small subtle icon-only"
						title="GitHub"
						href="https://github.com/liu7say/JSONTool"
						target="_blank"
						style="
							text-decoration: none;
							display: flex;
							align-items: center;
							justify-content: center;
						">
						<img
							:src="GithubIconUrl"
							alt="GitHub"
							style="width: 16px; height: 16px" />
					</a>
				</div>
			</div>
		</div>

		<!-- 下方工作区：侧边栏 + 内容 -->
		<div class="workspace">
			<!-- 左侧边栏 (Vertical Tabs) -->
			<div
				class="sidebar f-acrylic"
				:class="{ collapsed: sessionStore.sidebarCollapsed }">
				<div
					class="toggle-btn"
					@click="sessionStore.toggleSidebar"
					:title="sessionStore.sidebarCollapsed ? '展开' : '收起'">
					<component
						:is="sessionStore.sidebarCollapsed ? ArrowRight : ArrowLeft"
						style="width: 12px" />
				</div>

				<div class="tabs-list f-tabs vertical">
					<draggable
						v-model="tabsList"
						item-key="id"
						:animation="200"
						ghost-class="ghost-tab"
						drag-class="drag-tab"
						:disabled="sessionStore.sidebarCollapsed"
						class="drag-container">
						<template #item="{ element: tab }">
							<div
								class="f-tab-item vertical"
								:class="{ active: sessionStore.activeTabId === tab.id }"
								:data-id="tab.id"
								@click="sessionStore.setActive(tab.id)"
								@mousedown.middle.prevent="sessionStore.closeTab(tab.id)"
								@mouseenter="(e) => onTabMouseEnter(e, tab.id)"
								@mouseleave="onTabMouseLeave">
								<div class="tab-content">
									<span class="tab-text" :title="tab.title">
										{{
											sessionStore.sidebarCollapsed
												? getShortTitle(tab.title)
												: tab.title
										}}
									</span>
								</div>
								<span
									class="tab-close"
									@click.stop="sessionStore.closeTab(tab.id)"
									title="关闭">
									<component :is="Close" style="width: 12px; height: 12px" />
								</span>
							</div>
						</template>
					</draggable>

					<!-- 新建标签页按钮 (行内) -->
					<div class="new-tab-wrapper">
						<FButton
							type="subtle"
							icon-only
							class="new-tab-btn"
							@click="sessionStore.createTab()"
							title="新建标签页">
							<component :is="Plus" style="width: 16px" />
						</FButton>
					</div>
				</div>
			</div>

			<!-- 主内容区 -->
			<div class="content-area">
				<JsonEditor
					v-if="activeTab"
					ref="jsonEditorRef"
					:doc="activeTab.doc"
					:view-mode="activeTab.viewMode"
					:selected-array-path="activeTab.selectedArrayPath"
					:compare-content="activeTab.compareContent"
					@update:doc="(val) => onUpdateDoc(activeTab.id, val)"
					@update:view-mode="(val) => onUpdateViewMode(activeTab.id, val)"
					@update:selected-array-path="
						(val) => onUpdateArrayPath(activeTab.id, val)
					"
					@update:compare-content="
						(val) => onUpdateCompareContent(activeTab.id, val)
					"
					@save="onSaveHistory(activeTab)" />
				<div v-else class="empty-state">
					<div class="empty-content">
						<h3>没有打开的文件</h3>
						<FButton type="primary" @click="sessionStore.createTab()">
							新建 JSON
						</FButton>
					</div>
				</div>
			</div>
		</div>

		<!-- 折叠标签页的悬浮弹出框 -->
		<div
			v-if="sessionStore.sidebarCollapsed && hoveredTab"
			class="tab-popover f-tab-item vertical active"
			:style="popoverStyle"
			@mouseenter="onPopoverMouseEnter"
			@mouseleave="onPopoverMouseLeave"
			@click="
				sessionStore.setActive(hoveredTab.id);
				hoveredTabId = null;
			"
			@mousedown.middle.prevent="sessionStore.closeTab(hoveredTab.id)">
			<div class="tab-content">
				<span class="tab-text" :title="hoveredTab.title">{{
					hoveredTab.title
				}}</span>
			</div>
			<span
				class="tab-close"
				@click.stop="sessionStore.closeTab(hoveredTab.id)"
				title="关闭">
				<component :is="Close" style="width: 12px; height: 12px" />
			</span>

			<!-- 如果这是当前激活的标签页，复制激活指示器样式 -->
			<div
				v-if="sessionStore.activeTabId === hoveredTab.id"
				class="popover-indicator"></div>
		</div>

		<!-- 全局底部状态栏 -->
		<div class="footer status-bar" :class="{ error: statusBarInfo.isError }">
			<span>{{ statusBarInfo.text }}</span>
		</div>

		<!-- 历史记录抽屉 (Custom Fluent Drawer) -->
		<div
			class="f-drawer-overlay"
			v-if="showHistory"
			@click="showHistory = false"></div>
		<div class="f-drawer" :class="{ open: showHistory }">
			<div class="f-drawer-header">
				<span>历史记录</span>
				<FButton type="subtle" icon-only @click="showHistory = false">
					<component :is="Close" style="width: 18px" />
				</FButton>
			</div>

			<div class="history-list">
				<div v-if="!historyStore.index.length" class="muted-text">
					暂无历史记录
				</div>
				<div
					v-for="item in historyStore.index"
					:key="item.id"
					class="history-entry f-card"
					@click="loadHistoryEntry(item)">
					<div class="entry-main">
						<div class="entry-title">{{ item.title }}</div>
						<div class="entry-time">
							{{ new Date(item.createdAt).toLocaleString() }}
						</div>
					</div>
					<FButton
						type="subtle"
						icon-only
						class="entry-del"
						@click.stop="historyStore.removeEntry(item.id)"
						title="删除">
						<component
							:is="Delete"
							style="width: 14px; color: var(--f-color-error)" />
					</FButton>
				</div>

				<div v-if="historyStore.index.length" class="history-footer">
					<FButton
						type="subtle"
						style="color: var(--f-color-error)"
						@click="historyStore.clearAll">
						清空全部
					</FButton>
				</div>
			</div>
		</div>

		<!-- Toast Notification -->
		<transition name="toast-fade">
			<div v-if="toastVisible" class="toast-notification f-acrylic">
				<component
					:is="Check"
					style="width: 16px; color: var(--f-brand-base)" />
				<span>{{ toastMessage }}</span>
			</div>
		</transition>
	</div>
</template>

<style scoped lang="scss">
.app-container {
	display: flex;
	flex-direction: column; /* 回到列布局，因为 Header 在顶部，Workspace 在底部 */
	height: 100vh;
	overflow: hidden;
}

.header {
	height: 48px;
	display: flex;
	align-items: center;
	padding: 0 16px 0 13px;
	border-bottom: 1px solid var(--f-border-subtle);
	background-color: var(--f-bg-layer1);
	z-index: 100;
	flex-shrink: 0;
}

.brand {
	display: flex;
	align-items: center;
	// justify-content: center;
	gap: 8px;
	font-size: 16px;
	margin-right: 0; /* 移除 margin-right，让 padding 处理间距 */
	width: 200px; /* 匹配侧边栏宽度 */
	flex-shrink: 0;
	color: var(--f-brand-base);
	transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

	/* 视觉上将 logo 与侧边栏边框分开 */
	padding-right: 16px;
	border-right: 1px solid var(--f-border-subtle);
}

.header-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-width: 0;
}

.workspace {
	flex: 1;
	display: flex;
	flex-direction: row;
	overflow: hidden;
}

/* Button Group Styles */
.f-button-group {
	display: flex;
	align-items: center;
	position: relative;
	/* 移除容器边框，改为按钮各自持有边框以支持独立缩放 */
	border: none;
	background-color: transparent;
	/* 移除容器阴影，由按钮自身处理或移除 */
	box-shadow: none;

	&:hover {
		/* 移除容器 hover 效果 */
		border-color: transparent;
		box-shadow: none;
	}

	.f-button {
		border-radius: 0;
		/* 恢复边框 */
		border: 1px solid var(--f-border-default);
		box-shadow: none !important;
		margin: 0;
		/* 处理边框重叠 */
		margin-left: -1px;
		height: 24px;
		background-color: transparent;
		color: var(--f-text-primary);
		position: relative;
		padding: 0 8px;

		/* Flex alignment for Icon + Text */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;

		&:hover,
		&:focus {
			background-color: var(--f-bg-control-hover);
			/* 确保 hover 时浮起在相邻按钮之上 */
			z-index: 5;
			border-color: var(--f-text-secondary); /* Hover 时稍微加深边框 */
		}

		&:active {
			background-color: var(--f-bg-control-active);
			/* 恢复缩放动画 */
			transform: scale(0.96);
			z-index: 5;
		}

		/* Fix Corners */
		&:first-child {
			border-top-left-radius: 4px;
			border-bottom-left-radius: 4px;
			margin-left: 0;
		}
		&:last-child {
			border-top-right-radius: 4px;
			border-bottom-right-radius: 4px;
		}

		/* Generic Separator: Apply to all except the last one */
		&:not(:last-child) {
			border-right: 1px solid var(--f-border-subtle);
		}

		&.group-left {
			/* Already handled by generic rule, but ensure padding */
			padding: 0 8px;
		}

		&.group-right {
			padding: 0; /* Icon only override */
			width: 20px; /* Slightly narrower */
			/* display: flex; already set globally above */
		}

		/* Restore Primary Button Style priority */
		&.primary {
			background-color: var(--f-brand-base);
			color: white; /* Always white on primary */

			&:hover {
				background-color: var(--f-brand-hover);
			}

			&:active {
				background-color: var(--f-brand-pressed);
			}

			/* Remove separator for primary buttons if desired, or keep it light? 
			   Usually primary buttons don't have borders, but if they are next to something, 
			   the group border is enough. Inside, maybe a darker blue separator? 
			   For now let's leave the subtle separator or hide it? 
			   Let's hide the right border for primary buttons to make them look cleaner 
			   unless they are not the last one. 
			   Actually, let's keep the separator but make it compatible with the blue bg. 
			   rgba(255,255,255, 0.2) 
			*/
			&:not(:last-child) {
				border-right: 1px solid rgba(255, 255, 255, 0.2);
			}

			/* Fix shadow for primary */
			box-shadow: none; /* Group handles shadow */
		}

		/* Danger Button Style within group */
		&.danger {
			background-color: var(--f-color-error);
			color: white;

			&:hover {
				filter: brightness(0.9);
			}

			&:active {
				filter: brightness(0.8);
			}

			&:not(:last-child) {
				border-right: 1px solid rgba(255, 255, 255, 0.2);
			}

			box-shadow: none;
		}

		/* Disable state handling */
		&:disabled {
			background-color: transparent;
			color: var(--f-text-disabled);
			cursor: not-allowed;
			&:hover {
				background-color: transparent;
			}
		}
	}
}

.f-popover-menu {
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 4px;
	background-color: var(--f-bg-layer2);
	border: 1px solid var(--f-border-default);
	border-radius: 6px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	padding: 4px;
	min-width: 130px;
	z-index: 1000;
	display: flex;
	flex-direction: column;

	.menu-item {
		display: flex;
		align-items: center;
		padding: 6px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
		color: var(--f-text-primary);
		gap: 8px;
		user-select: none;

		&:hover {
			background-color: var(--f-bg-control-hover);
		}

		.check-box {
			width: 16px;
			height: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--f-brand-base);
		}
	}
}

/* 菜单过渡 */
.fade-scale-enter-active,
.fade-scale-leave-active {
	transition:
		opacity 0.15s ease,
		transform 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
	opacity: 0;
	transform: scale(0.95) translateY(-4px);
}

/* 侧边栏样式 */
.sidebar {
	width: 150px; /* 展开宽度 */
	display: flex;
	flex-direction: column;
	border-right: 1px solid var(--f-border-default);
	background-color: var(--f-bg-layer2);
	z-index: 50;
	flex-shrink: 0;
	position: relative;
	transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

	&.collapsed {
		width: 48px; /* 折叠宽度：显示图标/首字母 */

		.f-tab-item.vertical {
			padding: 6px 4px; /* 更紧凑的 padding */
			justify-content: center;

			.tab-content {
				margin: 0;
				text-align: center;
			}

			.tab-close {
				display: none; /* 折叠模式下隐藏关闭按钮 */
			}

			/* 折叠模式激活状态：显示左侧指示器 (::before) */
			&.active {
				&::before {
					opacity: 1;
				}
				&::after {
					opacity: 0;
				}
			}
		}

		.new-tab-btn {
			/* 仅图标，居中 */
		}

		/* 折叠模式下切换按钮居中 */
		.toggle-btn {
			justify-content: center;
			padding: 8px 0;
			border-radius: 0;
			border-bottom: 1px solid var(--f-border-subtle);
			margin-bottom: 4px;
			background-color: transparent;

			&:hover {
				background-color: var(--f-bg-control-hover);
			}
		}
	}
}

.toggle-btn {
	/* 顶部静态位置 */
	width: 100%;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: flex-end; /* 展开模式下右对齐 */
	padding: 0 8px;
	cursor: pointer;
	color: var(--f-text-secondary);
	border-bottom: 1px solid var(--f-border-subtle);
	margin-bottom: 4px;
	transition:
		background-color 0.2s,
		color 0.2s;

	&:hover {
		background-color: var(--f-bg-control-hover);
		color: var(--f-text-primary);
	}
}

.tabs-list {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
	padding: 8px 4px; /* 减少 padding */
	transition: opacity 0.2s;
	user-select: none;

	&::-webkit-scrollbar {
		width: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: var(--f-border-default);
		border-radius: 4px;
	}
}

.f-tab-item.vertical {
	display: flex;
	align-items: center;
	padding: 6px 8px; /* 紧凑 padding */
	margin: 0 0 2px 0; /* 最小间距 */
	border-radius: 4px;
	cursor: pointer;
	position: relative;
	transition: background-color 0.2s;
	border: 1px solid transparent;
	min-height: 32px; /* 减少高度 */

	&:hover {
		background-color: var(--f-bg-control-hover);
	}

	&.active {
		background-color: var(--f-bg-control-active);
		border: 1px solid var(--f-border-default);

		/* 指示器基础样式 */
		&::before,
		&::after {
			content: '';
			position: absolute;
			background-color: var(--f-brand-base);
			border-radius: 2px;
			display: block;
			transition: opacity 0.2s ease;
			pointer-events: none;
		}

		/* 折叠状态指示器：左侧垂直条 */
		&::before {
			left: 0;
			top: 8px;
			bottom: 8px;
			width: 3px;
			opacity: 0; /* 默认隐藏（展开模式使用 ::after） */
		}

		/* 展开状态指示器：底部水平线 */
		&::after {
			left: 0;
			right: 0;
			bottom: 0;
			height: 3px;
			width: auto;
			opacity: 1; /* 默认可见 */
		}
	}

	&.active .popover-indicator {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		width: auto;
		background-color: var(--f-brand-base);
		border-radius: 2px;
	}

	.tab-content {
		flex: 1;
		min-width: 0;
		margin-right: 4px;
		margin-left: 6px;
	}

	.tab-text {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
	}

	.tab-close {
		opacity: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		color: var(--f-text-secondary);

		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
			color: var(--f-text-primary);
		}
	}

	&:hover .tab-close,
	&.active .tab-close {
		opacity: 1;
	}
}

/* 拖拽相关样式 */
.drag-container {
	display: flex;
	flex-direction: column;
	min-height: 10px; /* 保证有空位可以拖入 */
}

.ghost-tab {
	opacity: 0.5;
	background-color: var(--f-bg-control-alt);
	border: 1px dashed var(--f-border-default);

	/* 隐藏内部元素以保持简洁 */
	// .tab-content, .tab-close {
	// 	opacity: 0.5;
	// }
}

.drag-tab {
	/* 拖拽时的样式，通常不需要特别设置，vuedraggable 会处理 */
	cursor: grabbing;
	background-color: var(--f-bg-layer2);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 9999;
}

.tab-popover {
	position: fixed;
	z-index: 1000;
	background-color: var(--f-bg-layer2);
	border: 1px solid var(--f-border-default);
	border-radius: 6px;
	box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
	align-items: center;
	padding: 6px 8px;
	cursor: pointer;
	display: flex;

	.tab-content {
		flex: 1;
		min-width: 0;
		margin-right: 4px;
		margin-left: 6px;
	}

	.tab-text {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
	}

	.tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		color: var(--f-text-secondary);

		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
			color: var(--f-text-primary);
		}
	}

	/* 弹出框内激活指示器样式 */
	.popover-indicator {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		width: auto;
		background-color: var(--f-brand-base);
		border-radius: 2px;
	}
}

.new-tab-wrapper {
	padding: 4px 0;
	display: flex;
	justify-content: center;
}

.new-tab-btn {
	width: 100%;
	height: 32px;
	border-radius: 4px;
	background-color: transparent;
	border: 1px dashed var(--f-border-default);
	color: var(--f-text-secondary);
	&:hover {
		background-color: var(--f-bg-control-hover);
		border-color: var(--f-text-secondary);
		color: var(--f-text-primary);
	}
}

.toolbar-group {
	display: flex;
	align-items: center;
	gap: 12px;

	&.left {
		flex: 1;
		justify-content: flex-start;
		/* overflow: hidden; 移除以允许下拉菜单 */
	}

	&.right {
		flex-shrink: 0;
	}
}

.tool-section {
	display: flex;
	align-items: center;
	gap: 6px;
	padding-right: 12px;
	border-right: 1px solid var(--f-border-default);

	&:last-child {
		border-right: none;
	}
}

.content-area {
	flex: 1;
	overflow: hidden;
	position: relative;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

.empty-content {
	text-align: center;
	color: var(--f-text-secondary);

	h3 {
		margin-bottom: 20px;
		font-weight: normal;
	}
}

.footer {
	flex-shrink: 0;
	height: 24px;
	padding: 0 16px;
	display: flex;
	align-items: center;
	background-color: var(--f-brand-base);
	color: white;
	font-size: 11px;
	z-index: 100;
	user-select: none;

	&.error {
		background-color: var(--f-color-error);
	}
}
/* 历史记录列表样式（同前） */
.history-list {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-right: 4px;
}

.history-entry {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	cursor: pointer;
	transition: background-color 0.2s;
	background-color: var(--f-bg-layer1);

	&:hover {
		background-color: var(--f-bg-control-hover);
		border-color: var(--f-border-default);
	}
}

.entry-main {
	flex: 1;
	overflow: hidden;
}

.entry-title {
	font-weight: 500;
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.entry-time {
	font-size: 11px;
	color: var(--f-text-secondary);
	margin-top: 4px;
}

.history-footer {
	margin-top: 16px;
	text-align: center;
}

.muted-text {
	text-align: center;
	color: var(--f-text-secondary);
	padding: 40px 0;
}

/* Toast 样式 */
.toast-notification {
	position: fixed;
	bottom: 40px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	border-radius: 20px;
	background-color: var(--f-bg-layer2);
	border: 1px solid var(--f-border-default);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 2000;
	font-size: 13px;
	color: var(--f-text-primary);
	user-select: none;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
	transition:
		opacity 0.2s,
		transform 0.2s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
	opacity: 0;
	transform: translate(-50%, 10px);
}

/* 按钮弹跳动画 */
.bump-animation {
	animation: bump 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes bump {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
	}
}

/* 拖拽相关样式 */
.drag-container {
	display: flex;
	flex-direction: column;
	min-height: 10px; /* 保证有空位可以拖入 */
}

.ghost-tab {
	opacity: 0.5;
	background-color: var(--f-bg-control-alt);
	border: 1px dashed var(--f-border-default);

	/* 隐藏内部元素以保持简洁 */
	// .tab-content, .tab-close {
	// 	opacity: 0.5;
	// }
}

.drag-tab {
	/* 拖拽时的样式，通常不需要特别设置，vuedraggable 会处理 */
	cursor: grabbing;
	background-color: var(--f-bg-layer2);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 9999;
}
</style>
