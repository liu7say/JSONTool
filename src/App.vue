<script setup>
import { onMounted, ref } from 'vue';
import { useSessionStore } from './stores/session';
import { useHistoryStore } from './stores/history';
import { useThemeStore } from './stores/theme';
import JsonEditor from './components/JsonEditor.vue';
import {
	Plus,
	Close,
	Clock,
	Delete,
	Moon,
	Sunny,
	Collection,
} from '@element-plus/icons-vue';

const sessionStore = useSessionStore();
const historyStore = useHistoryStore();
const themeStore = useThemeStore();

const showHistory = ref(false);

onMounted(() => {
	if (sessionStore.tabs.length === 0) {
		sessionStore.createTab();
	}
	historyStore.loadIndex();
});

const onUpdateDoc = (id, text) => {
	sessionStore.updateTabDoc(id, text);
};

const onUpdateViewMode = (id, mode) => {
	sessionStore.updateTabViewMode(id, mode);
};

const onUpdateArrayPath = (id, path) => {
	sessionStore.updateTabArrayPath(id, path);
};

const onSaveHistory = async (tab) => {
	try {
		await historyStore.saveEntry({
			doc: { ...tab.doc, parsedValue: null },
			toolState: { viewMode: tab.viewMode },
			title: tab.title || '未命名快照',
		});
	} catch (e) {
		console.error(e);
	}
};

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
				<span class="logo-icon"><Collection /></span>
				<span style="font-weight: 600">JSON</span>Tool
			</div>

			<div class="tabs-scroll f-tabs">
				<div
					v-for="tab in sessionStore.tabs"
					:key="tab.id"
					class="f-tab-item"
					:class="{ active: sessionStore.activeTabId === tab.id }"
					@click="sessionStore.setActive(tab.id)">
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

			<div class="header-actions">
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

.tabs-scroll {
	flex: 1;
	height: 100%;
	align-items: center;
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
