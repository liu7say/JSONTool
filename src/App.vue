<template>
	<div class="app-container" translate="no">
		<!-- 顶部统一导航与工具栏 -->
		<HeaderView
			:editor="contentViewRef"
			@open-history="showHistory = true"
			@open-settings="showSettings = true"
			@save-history="onSaveHistory" />

		<!-- 下方核心工作区：左侧标签边栏 + 右侧主内容编辑区 -->
		<div class="workspace">
			<SidebarView />
			<ContentView
				ref="contentViewRef"
				@save="onSaveHistory" />
		</div>

		<!-- 全局底部状态栏 -->
		<StatusBarView />

		<!-- 右侧历史记录抽屉 (从右侧滑出) -->
		<HistoryDrawerView v-model:visible="showHistory" />

		<!-- 全局中央设置弹窗 -->
		<SettingsModal v-model:visible="showSettings" />

		<!-- Toast 轻量全局通知 -->
		<transition name="toast-fade">
			<div v-if="toastVisible" class="toast-notification f-acrylic">
				<component
					:is="Check"
					style="width: 16px; color: var(--colorBrandBackground)" />
				<span>{{ toastMessage }}</span>
			</div>
		</transition>
	</div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSessionStore } from './stores/session';
import { useHistoryStore } from './stores/history';
import { useSettingsStore } from './stores/settings';
import HeaderView from './view/HeaderView.vue';
import SidebarView from './view/SidebarView.vue';
import ContentView from './view/ContentView.vue';
import StatusBarView from './view/StatusBarView.vue';
import HistoryDrawerView from './view/HistoryDrawerView.vue';
import SettingsModal from './view/SettingsModal.vue';
import { IconCheck as Check } from '@tabler/icons-vue';

const { t } = useI18n();
const sessionStore = useSessionStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();

// 引用与抽屉/弹窗状态
const contentViewRef = ref(null);
const showHistory = ref(false);
const showSettings = ref(false);

// 全局 Toast 提示状态
const toastVisible = ref(false);
const toastMessage = ref('');
let toastTimer = null;

const showToast = (message) => {
	if (toastTimer) clearTimeout(toastTimer);
	toastMessage.value = message;
	toastVisible.value = true;
	toastTimer = setTimeout(() => {
		toastVisible.value = false;
	}, 2000);
};

/**
 * 保存当前快照到历史记录
 * @param {Object} [targetTab] - 可选指定 Tab，默认取当前激活 Tab
 */
const onSaveHistory = async (targetTab = sessionStore.activeTab) => {
	if (!targetTab) return;
	try {
		await historyStore.saveEntry({
			doc: { ...targetTab.doc, parsedValue: null },
			toolState: { viewMode: targetTab.viewMode },
			title: targetTab.title || t('app.untitledSnapshot'),
		});
		showToast(t('app.savedSnapshot'));
	} catch (e) {
		console.error(e);
	}
};

// 会话快照持久化队列控制
let workspaceSaveInFlight = false;
let workspaceSaveQueued = false;
let unsubscribeSessionStore = null;

const saveWorkspaceNow = () => {
	// 如果用户关闭了自动存储，则直接跳过落盘
	if (!settingsStore.autoSaveWorkspace) {
		return Promise.resolve();
	}

	if (workspaceSaveInFlight) {
		workspaceSaveQueued = true;
		return Promise.resolve();
	}

	workspaceSaveInFlight = true;
	return sessionStore
		.saveWorkspaceSnapshot()
		.catch((error) => {
			console.error(error);
		})
		.finally(() => {
			workspaceSaveInFlight = false;
			if (workspaceSaveQueued) {
				workspaceSaveQueued = false;
				saveWorkspaceNow();
			}
		});
};

// 监听自动存储开关切换
watch(
	() => settingsStore.autoSaveWorkspace,
	(enabled) => {
		if (enabled) {
			saveWorkspaceNow();
		} else {
			// 关闭时立即清理已落盘草稿，防止敏感数据留存
			sessionStore.clearWorkspaceSnapshot();
		}
	},
);

onMounted(async () => {
	await settingsStore.loadSettings();

	try {
		// 仅在开启了自动存储时恢复上次会话草稿，否则新建干净的空白 Tab
		let restored = false;
		if (settingsStore.autoSaveWorkspace) {
			restored = await sessionStore.loadWorkspaceSnapshot();
		}
		if (!restored) sessionStore.createTab();
	} catch (error) {
		console.error(error);
		if (sessionStore.tabs.length === 0) sessionStore.createTab();
	}

	historyStore.loadIndex();
	unsubscribeSessionStore = sessionStore.$subscribe(saveWorkspaceNow, {
		detached: true,
	});
	if (settingsStore.autoSaveWorkspace) {
		saveWorkspaceNow();
	}
});

onUnmounted(() => {
	unsubscribeSessionStore?.();
	unsubscribeSessionStore = null;
	if (settingsStore.autoSaveWorkspace) {
		saveWorkspaceNow();
	}
	if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style lang="scss">
.app-container {
	height: 100vh;
	width: 100vw;
	display: flex;
	flex-direction: column;
	background-color: var(--colorNeutralBackground1);
	color: var(--colorNeutralForeground1);
	overflow: hidden;
}

.workspace {
	flex: 1;
	display: flex;
	flex-direction: row;
	overflow: hidden;
}

/* Toast 提示样式 */
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
	background-color: var(--colorNeutralBackground3);
	border: 1px solid var(--colorNeutralStroke1);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 2000;
	font-size: 13px;
	color: var(--colorNeutralForeground1);
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
</style>
