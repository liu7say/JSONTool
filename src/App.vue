<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch, computed } from 'vue';
import { useSessionStore } from './stores/session';
import { useHistoryStore } from './stores/history';
import { useThemeStore } from './stores/theme';
import JsonEditor from './components/JsonEditor.vue';
import GithubIcon from './components/GithubIcon.vue';
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
} from '@element-plus/icons-vue';

// 状态管理 stores
const sessionStore = useSessionStore();
const historyStore = useHistoryStore();
const themeStore = useThemeStore();

// UI 状态 refs
const showHistory = ref(false); // 控制历史记录抽屉的显示
const jsonEditorRef = ref(null); // JsonEditor 实例引用

// 排序功能状态
const sortStructureAtEnd = ref(false);
const showSortMenu = ref(false);
const sortButtonRef = ref(null);
const sortMenuRef = ref(null);

// 点击外部关闭排序菜单
const handleClickOutsideSort = (e) => {
	if (
		showSortMenu.value &&
		sortButtonRef.value &&
		!sortButtonRef.value.contains(e.target) &&
		sortMenuRef.value &&
		!sortMenuRef.value.contains(e.target)
	) {
		showSortMenu.value = false;
	}
};

// 全局快捷键处理
const handleGlobalKeydown = (e) => {
	// Ctrl+S (Windows) or Cmd+S (Mac)
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
		e.preventDefault();
		if (sessionStore.activeTab) {
			onSaveHistory(sessionStore.activeTab);
		}
	}
};

onMounted(() => {
	window.addEventListener('click', handleClickOutsideSort);
	if (sessionStore.tabs.length === 0) {
		sessionStore.createTab();
	}
	historyStore.loadIndex();
	window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
	window.removeEventListener('click', handleClickOutsideSort);
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
const triggerFormat = () => jsonEditorRef.value?.applyFormat();
const triggerCompact = () => jsonEditorRef.value?.applyCompact();

const triggerSort = () => {
	jsonEditorRef.value?.applySort({ structureAtEnd: sortStructureAtEnd.value });
	showSortMenu.value = false;
};

const toggleSortStructureAtEnd = () => {
	sortStructureAtEnd.value = !sortStructureAtEnd.value;
	triggerSort();
};
const triggerToggleTableRaw = () => jsonEditorRef.value?.toggleTableMode();
const triggerToggleDiff = () => jsonEditorRef.value?.toggleDiffMode();
const triggerNextError = () => jsonEditorRef.value?.jumpToNextError();

// --- 侧边栏 Hover Popover 逻辑 ---
const hoveredTabId = ref(null);
const popoverStyle = ref({ top: '0px', left: '0px', width: '200px' });
let hoverTimer = null;

const getShortTitle = (title) => {
	if (!title) return '';
	// Return first character (handle surrogate pairs if needed, but simple index is fine for now)
	return String(title).substring(0, 1).toUpperCase();
};

const onTabMouseEnter = (e, tabId) => {
	if (!sessionStore.sidebarCollapsed) {
		hoveredTabId.value = null;
		return;
	}

	const target = e.currentTarget;
	const rect = target.getBoundingClientRect();

	// Set position: Align directly over the collapsed tab but expanded width
	popoverStyle.value = {
		top: rect.top + 'px',
		left: rect.left + 'px',
		width: '200px', // Fixed expanded width
	};

	hoveredTabId.value = tabId;

	if (hoverTimer) clearTimeout(hoverTimer);
};

const onTabMouseLeave = (e) => {
	// If moving to the popover, don't close
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
	// If moving back to the sidebar tab, allow the tab's mouseenter to handle it (by clearing timer)
	// But we still set the timer here in case we moved to nowhere

	hoverTimer = setTimeout(() => {
		hoveredTabId.value = null;
	}, 100);
};

// 辅助计算属性
const activeTab = computed(() => sessionStore.activeTab);
const hoveredTab = computed(() =>
	sessionStore.tabs.find((t) => t.id === hoveredTabId.value)
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

	// Code Mode
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
						<button
							v-if="activeTab.viewMode !== 'diff'"
							class="f-button small"
							:class="activeTab.viewMode === 'table' ? 'primary' : 'subtle'"
							:disabled="
								activeTab.viewMode !== 'table' &&
								!String(activeTab.doc.sourceText || '').trim()
							"
							@click="triggerToggleTableRaw">
							<component
								:is="activeTab.viewMode === 'table' ? Back : Grid"
								style="width: 14px" />
							{{ activeTab.viewMode === 'table' ? '返回' : '表格视图' }}
						</button>

						<button
							v-if="activeTab.viewMode !== 'table'"
							class="f-button small"
							:class="activeTab.viewMode === 'diff' ? 'primary' : 'subtle'"
							:disabled="
								activeTab.viewMode !== 'diff' &&
								!String(activeTab.doc.sourceText || '').trim()
							"
							@click="triggerToggleDiff">
							<component
								:is="activeTab.viewMode === 'diff' ? Back : Switch"
								style="width: 14px" />
							{{ activeTab.viewMode === 'diff' ? '退出对比' : '对比' }}
						</button>
					</div>

					<!-- 错误跳转 (仅 Code 模式) -->
					<div
						class="tool-section"
						v-if="activeTab.viewMode === 'code' && activeTab.doc.parseError">
						<button class="f-button small error-btn" @click="triggerNextError">
							跳到错误
						</button>
					</div>

					<!-- 格式化工具 (Code/Diff 模式) -->
					<div
						class="tool-section"
						v-if="
							activeTab.viewMode === 'code' || activeTab.viewMode === 'diff'
						">
						<button
							class="f-button small subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerFormat"
							title="Format">
							<component :is="DocumentCopy" style="width: 14px" /> 格式化
						</button>
						<button
							class="f-button small subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerCompact"
							title="Compact">
							<component :is="ScaleToOriginal" style="width: 14px" /> 压缩
						</button>
						<!-- Sort Button Group with Dropdown -->
						<div class="f-button-group" ref="sortButtonRef">
							<button
								class="f-button small subtle group-left"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click="triggerSort"
								title="按 Keys 排序">
								<component :is="Rank" style="width: 14px" /> 排序
							</button>
							<button
								class="f-button small subtle group-right icon-only"
								:disabled="!String(activeTab.doc.sourceText || '').trim()"
								@click.stop="showSortMenu = !showSortMenu"
								title="排序选项">
								<component :is="ArrowDown" style="width: 12px; height: 12px" />
							</button>

							<!-- Dropdown Menu -->
							<transition name="fade-scale">
								<div
									v-if="showSortMenu"
									class="f-popover-menu"
									ref="sortMenuRef">
									<div class="menu-item" @click="toggleSortStructureAtEnd">
										<span>结构类型在后</span>
										<div class="check-box">
											<component
												v-if="sortStructureAtEnd"
												:is="Check"
												style="width: 12px" />
										</div>
									</div>
								</div>
							</transition>
						</div>
					</div>
				</div>
				<div class="toolbar-group left" v-else></div>

				<!-- 右侧：全局操作组 -->
				<div class="toolbar-group right">
					<button
						v-if="activeTab"
						class="f-button small primary"
						@click="onSaveHistory(activeTab)">
						<component :is="Operation" style="width: 14px" /> 保存快照
					</button>

					<button
						class="f-button small subtle icon-only"
						@click="themeStore.toggle"
						:title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'">
						<component
							:is="themeStore.isDark ? Moon : Sunny"
							style="width: 16px" />
					</button>

					<button
						class="f-button small subtle icon-only"
						@click="showHistory = true"
						title="历史记录">
						<component :is="Clock" style="width: 16px" />
					</button>

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
						<GithubIcon style="width: 16px; height: 16px" />
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
					<div
						v-for="tab in sessionStore.tabs"
						:key="tab.id"
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

					<!-- New Tab Button (Inline) -->
					<div class="new-tab-wrapper">
						<button
							class="f-button subtle icon-only new-tab-btn"
							@click="sessionStore.createTab()"
							title="新建标签页">
							<component :is="Plus" style="width: 16px" />
						</button>
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
						<button class="f-button primary" @click="sessionStore.createTab()">
							新建 JSON
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Hover Popover for Collapsed Tabs -->
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

			<!-- Replicate Active Indicator styles if this is the active tab -->
			<div
				v-if="sessionStore.activeTabId === hoveredTab.id"
				class="popover-indicator"></div>
		</div>

		<!-- Global Footer Status Bar -->
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
				<button class="f-button subtle icon-only" @click="showHistory = false">
					<component :is="Close" style="width: 18px" />
				</button>
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
					<button
						class="f-button subtle icon-only entry-del"
						@click.stop="historyStore.removeEntry(item.id)"
						title="删除">
						<component
							:is="Delete"
							style="width: 14px; color: var(--f-color-error)" />
					</button>
				</div>

				<div v-if="historyStore.index.length" class="history-footer">
					<button
						class="f-button subtle"
						style="color: var(--f-color-error)"
						@click="historyStore.clearAll">
						清空全部
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.app-container {
	display: flex;
	flex-direction: column; /* Back to column, as Header is top, Workspace is bottom */
	height: 100vh;
	overflow: hidden;
}

.header {
	height: 48px;
	display: flex;
	align-items: center;
	padding: 0 16px;
	border-bottom: 1px solid var(--f-border-subtle);
	background-color: var(--f-bg-layer1);
	z-index: 100;
	flex-shrink: 0;
}

.brand {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
	margin-right: 0; /* Removing margin-right to let padding handle spacing */
	width: 200px; /* Match sidebar width */
	flex-shrink: 0;
	color: var(--f-brand-base);
	transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

	/* Separate logo from sidebar border visually */
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

	.f-button {
		border-radius: 4px;

		&.group-left {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
			margin-right: -1px; /* Merge borders */
			z-index: 1;

			&:hover,
			&:focus {
				z-index: 2;
			}
		}

		&.group-right {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
			padding: 0; /* Remove padding to trust flex centering */
			width: 24px; /* Slightly wider */
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1;

			&:hover,
			&:focus {
				z-index: 2;
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

/* Transition for menu */
.fade-scale-enter-active,
.fade-scale-leave-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
	opacity: 0;
	transform: scale(0.95) translateY(-4px);
}

/* Sidebar Styles */
.sidebar {
	width: 150px; /* Expanded Width */
	display: flex;
	flex-direction: column;
	border-right: 1px solid var(--f-border-default);
	background-color: var(--f-bg-layer2);
	z-index: 50;
	flex-shrink: 0;
	position: relative;
	transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

	&.collapsed {
		width: 48px; /* Collapsed Width: showing icon/initials */

		.f-tab-item.vertical {
			padding: 6px 4px; /* Tighter padding */
			justify-content: center;

			.tab-content {
				margin: 0;
				text-align: center;
			}

			.tab-close {
				display: none; /* Hide close button in collapsed mode */
			}

			/* Collapsed mode active state: Show Left Indicator (::before) */
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
			/* Icon only, centered */
		}

		/* Toggle button centered in collapsed mode */
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
	/* Static position at top */
	width: 100%;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: flex-end; /* Align right in expanded mode */
	padding: 0 8px;
	cursor: pointer;
	color: var(--f-text-secondary);
	border-bottom: 1px solid var(--f-border-subtle);
	margin-bottom: 4px;
	transition: background-color 0.2s, color 0.2s;

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
	padding: 8px 4px; /* Reduced padding */
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
	padding: 6px 8px; /* Compact padding */
	margin: 0 0 2px 0; /* Minimal spacing */
	border-radius: 4px;
	cursor: pointer;
	position: relative;
	transition: background-color 0.2s;
	border: 1px solid transparent;
	min-height: 32px; /* Reduced height */

	&:hover {
		background-color: var(--f-bg-control-hover);
	}

	&.active {
		background-color: var(--f-bg-control-active);
		border: 1px solid var(--f-border-default);

		/* Indicator Base Styles */
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

		/* Collapsed State Indicator: Left Vertical Bar */
		&::before {
			left: 0;
			top: 8px;
			bottom: 8px;
			width: 3px;
			opacity: 0; /* Hidden by default (Expanded mode uses ::after) */
		}

		/* Expanded State Indicator: Bottom Horizontal Line */
		&::after {
			left: 0;
			right: 0;
			bottom: 0;
			height: 3px;
			width: auto;
			opacity: 1; /* Visible by default */
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

	/* Styles for active indicator inside popover */
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
		/* overflow: hidden; Removed to allow dropdowns */
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
/* History List Styles (Same as before) */
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

.error-btn {
	background-color: var(--f-color-error) !important;
	color: white !important;
	border: none !important;

	&:hover {
		filter: brightness(0.9);
	}
}
</style>
