<script setup>
import { onMounted, ref } from 'vue';
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
	ArrowLeft,
	ArrowRight,
} from '@element-plus/icons-vue';

// 状态管理 stores
const sessionStore = useSessionStore();
const historyStore = useHistoryStore();
const themeStore = useThemeStore();

// UI 状态 refs
const showHistory = ref(false); // 控制历史记录抽屉的显示
const tabsContainer = ref(null); // Tab 容器的 DOM 引用
const showLeftGradient = ref(false); // 是否显示左侧滚动遮罩
const showRightGradient = ref(false); // 是否显示右侧滚动遮罩

/**
 * 检查 Tab 栏的滚动状态，决定是否显示左右的渐变遮罩
 * 这是一个纯粹的 UI 辅助函数，提升用户体验
 */
const checkScroll = () => {
	if (!tabsContainer.value) return;
	const { scrollLeft, scrollWidth, clientWidth } = tabsContainer.value;
	showLeftGradient.value = scrollLeft > 0;
	showRightGradient.value = Math.ceil(scrollLeft + clientWidth) < scrollWidth;
};

/**
 * 手动滚动 Tab 栏
 * @param {string} direction - 滚动方向 'left' | 'right'
 */
const scrollTabs = (direction) => {
	if (!tabsContainer.value) return;
	const scrollAmount = 200;
	tabsContainer.value.scrollBy({
		left: direction === 'left' ? -scrollAmount : scrollAmount,
		behavior: 'smooth',
	});
};

onMounted(() => {
	if (sessionStore.tabs.length === 0) {
		sessionStore.createTab();
	}
	historyStore.loadIndex();

	// Check scroll on mount
	setTimeout(checkScroll, 100);

	// Watch resize
	if (tabsContainer.value) {
		const ro = new ResizeObserver(checkScroll);
		ro.observe(tabsContainer.value);
	}
});

/**
 * 将当前激活的 Tab 滚动到可视区域
 * 使用 scrollIntoView 实现丝滑的定位
 */
const scrollToActiveTab = () => {
	if (!tabsContainer.value || !sessionStore.activeTabId) return;

	const activeTabEl = tabsContainer.value.querySelector(
		`[data-id="${sessionStore.activeTabId}"]`
	);

	if (activeTabEl) {
		activeTabEl.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'center', // 保持 Tab 居中
		});
	}
};

// 监听当前激活 Tab 的变化，自动滚动
watch(
	() => sessionStore.activeTabId,
	async () => {
		await nextTick();
		scrollToActiveTab();
	}
);

// 监听 Tab 数量变化，更新滚动状态指示器
import { watch, nextTick } from 'vue';
watch(
	() => sessionStore.tabs.length,
	async () => {
		await nextTick();
		checkScroll();
	}
);

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
</script>

<template>
	<div class="app-container">
		<!-- 顶部 Tab 栏 (Fluent Title Bar style) -->
		<div class="header f-acrylic">
			<div class="brand">
				<Logo />
			</div>

			<div class="tabs-wrapper">
				<div
					class="scroll-indicator left"
					v-if="showLeftGradient"
					@click="scrollTabs('left')">
					<component :is="ArrowLeft" />
				</div>
				<div
					class="tabs-scroll f-tabs"
					ref="tabsContainer"
					@scroll="checkScroll">
					<div
						v-for="tab in sessionStore.tabs"
						:key="tab.id"
						class="f-tab-item"
						:class="{ active: sessionStore.activeTabId === tab.id }"
						:data-id="tab.id"
						@click="sessionStore.setActive(tab.id)"
						@mousedown.middle.prevent="sessionStore.closeTab(tab.id)">
						<span class="tab-text">{{ tab.title }}</span>
						<span class="tab-close" @click.stop="sessionStore.closeTab(tab.id)">
							<component :is="Close" style="width: 12px; height: 12px" />
						</span>
					</div>

					<button
						class="f-button small subtle icon-only"
						@click="sessionStore.createTab()"
						title="新建标签页">
						<component :is="Plus" style="width: 16px" />
					</button>
				</div>
				<div
					class="scroll-indicator right"
					v-if="showRightGradient"
					@click="scrollTabs('right')">
					<component :is="ArrowRight" />
				</div>
			</div>

			<div class="header-actions">
				<!-- 保存快照 -->
				<button
					v-if="sessionStore.activeTab"
					class="f-button small primary"
					@click="onSaveHistory(sessionStore.activeTab)">
					<component :is="Operation" style="width: 14px" /> 保存快照
				</button>

				<!-- 主题切换 -->
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

		<!-- 主内容区 -->
		<div class="content-area">
			<JsonEditor
				v-if="sessionStore.activeTab"
				:doc="sessionStore.activeTab.doc"
				:view-mode="sessionStore.activeTab.viewMode"
				:selected-array-path="sessionStore.activeTab.selectedArrayPath"
				@update:doc="(val) => onUpdateDoc(sessionStore.activeTab.id, val)"
				@update:view-mode="
					(val) => onUpdateViewMode(sessionStore.activeTab.id, val)
				"
				@update:selected-array-path="
					(val) => onUpdateArrayPath(sessionStore.activeTab.id, val)
				"
				@save="onSaveHistory(sessionStore.activeTab)" />
			<div v-else class="empty-state">
				<div class="empty-content">
					<h3>没有打开的文件</h3>
					<button class="f-button primary" @click="sessionStore.createTab()">
						新建 JSON
					</button>
				</div>
			</div>
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
	flex-direction: column;
	height: 100vh;
	/* Background managed by body/globals */
}

.header {
	height: 48px; /* Classic Windows Titlebar height approx */
	display: flex;
	align-items: center;
	padding: 0 16px;
	border-bottom: 1px solid var(--f-border-subtle);
	background-color: var(--f-bg-layer1);
	z-index: 100;
}

.brand {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
	margin-right: 24px;
	color: var(--f-brand-base);

	.logo-icon {
		display: flex;
		font-size: 20px;
	}
}

.tabs-wrapper {
	flex: 1;
	height: 100%;
	position: relative;
	display: flex;
	align-items: center;
	min-width: 0; /* Prevent flex item from overflowing */
}

.tabs-scroll {
	flex: 1;
	height: 100%;
	display: flex;
	align-items: center;
	overflow-x: auto;
	/* Hide scrollbar */
	scrollbar-width: none;
	&::-webkit-scrollbar {
		display: none;
	}
}

.scroll-indicator {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 24px; /* Narrower touch target */
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	cursor: pointer;
	color: var(--f-text-tertiary); /* Lighter color */
	transition: color 0.2s;

	svg {
		width: 12px; /* Smaller icon */
		height: 12px;
	}

	&:hover {
		color: var(--f-text-primary);
	}

	&.left {
		left: 0;
		background: linear-gradient(
			to right,
			var(--f-bg-layer1) 40%,
			rgba(255, 255, 255, 0) 100%
		);
	}

	&.right {
		right: 0;
		background: linear-gradient(
			to left,
			var(--f-bg-layer1) 40%,
			rgba(255, 255, 255, 0) 100%
		);
	}
}

/* Override active tab color for better contrast */
:deep(.f-tab-item.active) {
	background-color: var(
		--f-bg-control-active
	); /* Darker than control, clear distinction */
	border: 1px solid var(--f-border-default); /* Add border to make it pop */
	border-bottom: none; /* Connect to content */
}

.header-actions {
	display: flex;
	gap: 8px;
	margin-left: 12px;
}

.content-area {
	flex: 1;
	overflow: hidden;
	position: relative;
	background-color: var(--f-bg-base);
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

/* History List Styles */
.history-list {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-right: 4px; /* Space for scrollbar */
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
</style>
