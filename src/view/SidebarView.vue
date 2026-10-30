<template>
	<!-- 左侧垂直边栏容器 -->
	<aside
		class="sidebar f-acrylic"
		:class="{ collapsed: sessionStore.sidebarCollapsed }">
		<!-- 侧边栏顶部 Header 工具栏区 (整行通栏可点击，盲点无压力) -->
		<div
			class="sidebar-header"
			:title="
				sessionStore.sidebarCollapsed
					? t('app.expandSidebar')
					: t('app.collapseSidebar')
			"
			:aria-label="
				sessionStore.sidebarCollapsed
					? t('app.expandSidebar')
					: t('app.collapseSidebar')
			"
			@click="sessionStore.toggleSidebar">
			<!-- 视觉指示器容器 (固定右锚点 12px，随边栏缩进平滑跟滑至正中) -->
			<div class="sidebar-toggle-indicator">
				<!-- Fluent 2 侧边栏语义化动画矢量图标 -->
				<svg
					class="sidebar-toggle-icon"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg">
					<!-- 主面板外框 -->
					<rect
						class="panel-frame"
						x="1.5"
						y="2.5"
						width="13"
						height="11"
						rx="2"
						stroke="currentColor"
						stroke-width="1.2" />
					<!-- 侧边栏垂直分割线 (展开态位于 x=5.5，折叠时平滑淡出贴边，无灰色残留) -->
					<line
						class="panel-divider"
						x1="5.5"
						y1="2.5"
						x2="5.5"
						y2="13.5"
						stroke="currentColor"
						stroke-width="1.2"
						stroke-linecap="round" />
					<!-- 导向折叠箭头 (伴随位移与 180 度翻转) -->
					<path
						class="panel-arrow"
						d="M10.5 5.5L8 8L10.5 10.5"
						stroke="currentColor"
						stroke-width="1.25"
						stroke-linecap="round"
						stroke-linejoin="round" />
				</svg>
			</div>
		</div>

		<!-- 垂直 Tab 标签列表 -->
		<div class="tabs-list f-tabs vertical" ref="tabsContainerRef">
			<!-- 单一平滑滑动指示器 (Sliding Indicator) -->
			<div
				class="tab-sliding-indicator"
				:style="indicatorStyle"
				v-show="indicatorVisible" />

			<draggable
				v-model="tabsList"
				item-key="id"
				:animation="200"
				ghost-class="ghost-tab"
				drag-class="drag-tab"
				:disabled="sessionStore.sidebarCollapsed"
				class="drag-container"
				@end="onTabDragEnd">
				<template #item="{ element: tab }">
					<div
						class="f-tab-item vertical"
						:class="{ active: sessionStore.activeTabId === tab.id }"
						:data-id="tab.id"
						@click="handleTabClick(tab.id)"
						@contextmenu.prevent="openTabContextMenu($event, tab)"
						@mousedown.middle.prevent="sessionStore.closeTab(tab.id)"
						@mouseenter="handleTabHoverEnter($event, tab.id)"
						@mouseleave="scheduleHoverLeave">
						<!-- 折叠图层：单字徽章 (绝对居中，交错弹性缩放淡入) -->
						<div class="tab-collapsed-layer">
							<span class="tab-badge">{{ getShortTitle(tab.title) }}</span>
						</div>

						<!-- 展开图层：完整标题与关闭按钮 (平滑滑入滑出) -->
						<div class="tab-expanded-layer">
							<div class="tab-title-wrap">
								<!-- 内联重命名输入框 -->
								<input
									v-if="renamingTabId === tab.id"
									ref="renameInputRef"
									v-model="renameTitleInput"
									class="tab-rename-input"
									@click.stop
									@keydown.enter="submitRenameTab(tab.id)"
									@keydown.esc="cancelRenameTab"
									@blur="submitRenameTab(tab.id)" />
								<span
									v-else
									class="tab-text"
									@dblclick.stop="startRenameTab(tab)">
									{{ tab.title }}
								</span>
							</div>

							<!-- 关闭标签按钮 -->
							<span
								class="tab-close"
								@click.stop="sessionStore.closeTab(tab.id)"
								:title="t('app.closeTab')">
								<component :is="Close" style="width: 12px; height: 12px" />
							</span>
						</div>
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
					:title="t('app.newTab')">
					<component :is="Plus" style="width: 16px" />
				</FButton>
			</div>
		</div>

		<!-- 折叠标签页的原位浮动展开卡片 (固定视口悬浮于编辑区上方，超出 48px 边栏边界) -->
		<Teleport to="body">
			<transition name="tab-flyout">
				<div
					v-if="sessionStore.sidebarCollapsed && hoveredTab"
					class="tab-flyout-card f-acrylic"
					:class="{
						active: sessionStore.activeTabId === hoveredTab.id,
						'hover-inactive': sessionStore.activeTabId !== hoveredTab.id,
					}"
					:style="flyoutStyle"
					@mouseenter="clearHoverTimer"
					@mouseleave="scheduleHoverLeave"
					@click="onFlyoutClick(hoveredTab.id)"
					@contextmenu.prevent="openTabContextMenu($event, hoveredTab)"
					@mousedown.middle.prevent="onFlyoutMiddleClick(hoveredTab.id)">
					<!-- 激活态左侧指示条 (与展开态 1:1 对齐，支持就地平滑伸展) -->
					<transition name="indicator-fade">
						<div
							v-if="sessionStore.activeTabId === hoveredTab.id"
							class="flyout-indicator" />
					</transition>

					<!-- 标题区域与内联重命名 -->
					<div class="tab-title-wrap">
						<input
							v-if="renamingTabId === hoveredTab.id"
							ref="renameInputRef"
							v-model="renameTitleInput"
							class="tab-rename-input"
							@click.stop
							@keydown.enter="submitRenameTab(hoveredTab.id)"
							@keydown.esc="cancelRenameTab"
							@blur="submitRenameTab(hoveredTab.id)" />
						<span
							v-else
							class="tab-text"
							@dblclick.stop="startRenameTab(hoveredTab)">
							{{ hoveredTab.title }}
						</span>
					</div>

					<!-- 关闭标签页按钮 (×) -->
					<span
						class="tab-close"
						@click.stop="onFlyoutCloseTab(hoveredTab.id)"
						:title="t('app.closeTab')">
						<component :is="Close" style="width: 12px; height: 12px" />
					</span>
				</div>
			</transition>
		</Teleport>

		<!-- Tab 鼠标右键上下文菜单 -->
		<FPopoverMenu
			v-model:visible="tabMenuVisible"
			:position="tabMenuPos"
			:items="tabMenuItems" />
	</aside>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import { useSessionStore } from '../stores/session';
import FButton from '../components/FButton.vue';
import FPopoverMenu from '../components/FPopoverMenu.vue';
import {
	IconPlus as Plus,
	IconX as Close,
	IconCopy as DocumentCopy,
	IconEdit as Edit,
	IconCircleX as CloseOthers,
	IconArrowBarToDown as CloseBelow,
} from '@tabler/icons-vue';

const { t } = useI18n();
const sessionStore = useSessionStore();

// 拖拽排序计算属性
const tabsList = computed({
	get: () => sessionStore.tabs,
	set: (value) => {
		sessionStore.tabs = value;
	},
});

// Tab 激活滑块与平滑滑动动画逻辑
const tabsContainerRef = ref(null);
const indicatorTop = ref(0);
const indicatorVisible = ref(false);

// 激活滑块位移样式（使用 GPU 硬件加速 translateY，避免重排）
const indicatorStyle = computed(() => ({
	transform: `translateY(${indicatorTop.value}px)`,
}));

/**
 * 更新 Tab 激活滑块位置（居中对齐目标标签）
 * @param {string} [tabId] - 可选目标 Tab ID，默认对齐当前激活 Tab
 */
const updateIndicatorPosition = (tabId = sessionStore.activeTabId) => {
	if (!tabsContainerRef.value || !tabId) {
		indicatorVisible.value = false;
		return;
	}
	const targetEl = tabsContainerRef.value.querySelector(`[data-id="${tabId}"]`);
	if (!targetEl) {
		indicatorVisible.value = false;
		return;
	}

	const INDICATOR_HEIGHT = 18;
	// 计算居中 Y 坐标：元素相对 offsetParent 顶部偏移 + 垂直居中差值
	const targetY =
		targetEl.offsetTop + (targetEl.offsetHeight - INDICATOR_HEIGHT) / 2;
	indicatorTop.value = Math.round(targetY);
	indicatorVisible.value = true;
};

/**
 * 标签点击切换：先启动滑块位移动画，再切换激活状态
 * 让 GPU 在主线程重构编辑器前就进入流畅的滑动动画
 * @param {string} tabId
 */
const handleTabClick = (tabId) => {
	updateIndicatorPosition(tabId);
	sessionStore.setActive(tabId);
};

// 拖拽排序结束后重新同步指示器位置
const onTabDragEnd = () => {
	nextTick(() => {
		updateIndicatorPosition();
	});
};

// 监听激活 Tab 变更（兼容键盘快捷键、新建标签等非点击切换，等待 DOM 挂载后测量）
watch(
	() => sessionStore.activeTabId,
	async (newId) => {
		if (newId) {
			await nextTick();
			updateIndicatorPosition(newId);
		}
	},
	{ immediate: true },
);

// 监听 Tab 列表整体变化（异步恢复、新建、关闭、复制），等待 DOM 结构更新后校准
watch(
	() => sessionStore.tabs,
	async () => {
		await nextTick();
		updateIndicatorPosition();
	},
	{ deep: false },
);

// 监听侧边栏折叠/展开状态变化 (在 250ms 宽度过渡动画完成后再次精准对齐)
watch(
	() => sessionStore.sidebarCollapsed,
	async () => {
		await nextTick();
		updateIndicatorPosition();
		setTimeout(() => {
			updateIndicatorPosition();
		}, 260);
	},
);

// 折叠态 Tab 浮动展开卡片相关状态 (Linus 式非对称防抖)
const hoveredTabId = ref(null);
const flyoutStyle = ref({ top: '0px', left: '0px' });
let flyoutLeaveTimer = null;

const getShortTitle = (title) => {
	if (!title) return '';
	return String(title).substring(0, 1).toUpperCase();
};

// 计算当前悬停的目标 Tab
const hoveredTab = computed(() =>
	sessionStore.tabs.find((t) => t.id === hoveredTabId.value),
);

// 清理离场防抖定时器
const clearHoverTimer = () => {
	if (flyoutLeaveTimer) {
		clearTimeout(flyoutLeaveTimer);
		flyoutLeaveTimer = null;
	}
};

// 鼠标移入折叠状态下的某个 Tab：即刻定位并展现浮层
const handleTabHoverEnter = (event, tabId) => {
	if (!sessionStore.sidebarCollapsed) {
		hoveredTabId.value = null;
		return;
	}

	// 若当前正在操作右键菜单或正在重命名，锁死当前交互目标，禁止切换其他 Tab
	if (tabMenuVisible.value || renamingTabId.value) {
		return;
	}

	clearHoverTimer();

	// 捕获目标标签项在视口中的精确坐标
	const rect = event.currentTarget.getBoundingClientRect();
	flyoutStyle.value = {
		top: `${rect.top}px`,
		left: `${rect.left}px`,
	};

	hoveredTabId.value = tabId;
};

// 鼠标移出 Tab 或移出浮层卡片：启动 140ms 防抖离场 (受交互锁保护)
const scheduleHoverLeave = () => {
	clearHoverTimer();
	// 若右键菜单正处于打开状态，或当前正在内联重命名，坚决保持浮动卡片展示，不予关闭
	if (tabMenuVisible.value || renamingTabId.value) {
		return;
	}
	flyoutLeaveTimer = setTimeout(() => {
		// 二次防抖检测，防止在定时器等待期间打开了右键菜单或重命名
		if (tabMenuVisible.value || renamingTabId.value) {
			return;
		}
		hoveredTabId.value = null;
	}, 140);
};

// 浮层交互：点击激活标签页 (原地响应式切换为 active，坚决不设 null 避免闪烁重绘)
const onFlyoutClick = (tabId) => {
	handleTabClick(tabId);
};

// 浮层交互：鼠标中键关闭标签页
const onFlyoutMiddleClick = (tabId) => {
	sessionStore.closeTab(tabId);
	hoveredTabId.value = null;
};

// 浮层交互：点击关闭按钮 (×)
const onFlyoutCloseTab = (tabId) => {
	sessionStore.closeTab(tabId);
	hoveredTabId.value = null;
};

// Tab 右键上下文菜单与重命名状态
const tabMenuVisible = ref(false);
const tabMenuPos = ref({ x: 0, y: 0 });
const tabMenuTarget = ref(null);

const renamingTabId = ref(null);
const renameTitleInput = ref('');
const renameInputRef = ref(null);

const openTabContextMenu = (event, tab) => {
	// 立即清除任何可能残留的离场定时器
	clearHoverTimer();
	tabMenuTarget.value = tab;
	tabMenuPos.value = { x: event.clientX, y: event.clientY };
	tabMenuVisible.value = true;

	// 若处于折叠状态，确保当前 tab 处于悬浮展示状态并校准精确坐标
	if (sessionStore.sidebarCollapsed) {
		hoveredTabId.value = tab.id;
		const targetEl =
			document.querySelector(`.f-tab-item.vertical[data-id="${tab.id}"]`) ||
			event.currentTarget;
		if (targetEl && targetEl.getBoundingClientRect) {
			const rect = targetEl.getBoundingClientRect();
			flyoutStyle.value = {
				top: `${rect.top}px`,
				left: `${rect.left}px`,
			};
		}
	}
};

// 监听右键上下文菜单可见性：菜单关闭时若无重命名，恢复常规离场判定
watch(tabMenuVisible, (visible) => {
	if (!visible && !renamingTabId.value) {
		scheduleHoverLeave();
	}
});

const startRenameTab = (tab) => {
	renamingTabId.value = tab.id;
	renameTitleInput.value = tab.title;
	nextTick(() => {
		const el = Array.isArray(renameInputRef.value)
			? renameInputRef.value[0]
			: renameInputRef.value;
		el?.focus();
		el?.select();
	});
};

const submitRenameTab = (tabId) => {
	if (renamingTabId.value !== tabId) return;
	const trimmed = renameTitleInput.value.trim();
	if (trimmed) {
		sessionStore.updateTabTitle(tabId, trimmed, true);
	}
	renamingTabId.value = null;
	// 重命名结束后若右键菜单已关闭，恢复常规离场判定
	if (!tabMenuVisible.value) {
		scheduleHoverLeave();
	}
};

const cancelRenameTab = () => {
	renamingTabId.value = null;
	// 重命名取消后若右键菜单已关闭，恢复常规离场判定
	if (!tabMenuVisible.value) {
		scheduleHoverLeave();
	}
};

const tabMenuItems = computed(() => {
	if (!tabMenuTarget.value) return [];
	const target = tabMenuTarget.value;
	const tabs = sessionStore.tabs;
	const targetIdx = tabs.findIndex((t) => t.id === target.id);
	const isLast = targetIdx === tabs.length - 1;
	const isOnlyOne = tabs.length <= 1;

	return [
		{
			id: 'duplicate',
			label: t('app.duplicateTab'),
			icon: DocumentCopy,
			action: () => sessionStore.duplicateTab(target.id, t('app.copySuffix')),
		},
		{
			id: 'rename',
			label: t('app.renameTab'),
			icon: Edit,
			action: () => startRenameTab(target),
		},
		{
			divider: true,
		},
		{
			id: 'close',
			label: t('app.closeTab'),
			icon: Close,
			action: () => sessionStore.closeTab(target.id),
		},
		{
			id: 'closeOthers',
			label: t('app.closeOtherTabs'),
			icon: CloseOthers,
			disabled: isOnlyOne,
			action: () => sessionStore.closeOtherTabs(target.id),
		},
		{
			id: 'closeBelow',
			label: t('app.closeTabsBelow'),
			icon: CloseBelow,
			disabled: isLast,
			action: () => sessionStore.closeTabsBelow(target.id),
		},
	];
});

onMounted(async () => {
	await nextTick();
	updateIndicatorPosition();
	window.addEventListener('resize', updateIndicatorPosition);
});

onUnmounted(() => {
	window.removeEventListener('resize', updateIndicatorPosition);
	clearHoverTimer();
});
</script>

<style lang="scss" scoped>
/* 侧边栏样式 */
.sidebar {
	width: 150px;
	display: flex;
	flex-direction: column;
	border-right: 1px solid var(--colorNeutralStroke1);
	background-color: var(--colorNeutralBackground3);
	z-index: 50;
	flex-shrink: 0;
	position: relative;
	transition: width 250ms cubic-bezier(0.2, 0.9, 0.2, 1);

	&.collapsed {
		width: 48px;

		.f-tab-item.vertical {
			/* 折叠时：展开层迅速向左微移并淡出 (110ms) */
			.tab-expanded-layer {
				opacity: 0;
				transform: translateX(-8px);
				pointer-events: none;
				transition:
					opacity 110ms ease-out,
					transform 140ms ease-out;
			}

			/* 折叠时：徽章层延时 70ms 优雅居中放大淡入 */
			.tab-collapsed-layer {
				opacity: 1;
				transform: scale(1);
				pointer-events: auto;
				transition:
					opacity 160ms cubic-bezier(0.2, 0.9, 0.2, 1) 70ms,
					transform 200ms cubic-bezier(0.2, 0.9, 0.2, 1) 70ms;
			}
		}

		/* 折叠状态下的联动动效：分割线彻底淡出，箭头平滑向中心位移并翻转 */
		.sidebar-header {
			.sidebar-toggle-indicator {
				.sidebar-toggle-icon {
					/* 分割线彻底淡出，无任何灰色残留 */
					.panel-divider {
						transform: translateX(-4px);
						opacity: 0;
					}

					/* 箭头向中心位移并翻转 180 度 */
					.panel-arrow {
						transform: translateX(-1.25px) rotate(180deg);
					}
				}
			}
		}
	}
}

/* 侧边栏顶部 Header 工具栏 (36px 高度，整行可点击，盲点无压力) */
.sidebar-header {
	width: 100%;
	height: 36px;
	position: relative;
	display: flex;
	align-items: center;
	padding: 0;
	box-sizing: border-box;
	border-bottom: 1px solid var(--colorNeutralStroke2);
	margin-bottom: 4px;
	cursor: pointer;
	user-select: none;
	color: var(--colorNeutralForeground2);
	transition:
		background-color 150ms ease,
		color 150ms ease;

	&:hover {
		background-color: var(--colorNeutralBackgroundSubtleHover);
		color: var(--colorNeutralForeground1);
	}

	&:active {
		background-color: var(--colorNeutralBackgroundSubtlePressed);

		.sidebar-toggle-indicator {
			transform: translateY(-50%) scale(0.92);
		}
	}

	/* 视觉指示器：固定右锚点 12px，展开停靠右上，折叠随边栏自然滑到 48px 正中 (12+24+12=48) */
	.sidebar-toggle-indicator {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		transition: transform 150ms cubic-bezier(0.2, 0.9, 0.2, 1);

		/* Fluent 2 语义化动画矢量图 */
		.sidebar-toggle-icon {
			width: 16px;
			height: 16px;
			overflow: visible;

			.panel-frame {
				transition: stroke 150ms ease;
			}

			.panel-divider {
				transition:
					transform 250ms cubic-bezier(0.2, 0.9, 0.2, 1),
					opacity 200ms ease;
			}

			.panel-arrow {
				transform-origin: 9.25px 8px;
				transition:
					transform 250ms cubic-bezier(0.2, 0.9, 0.2, 1),
					stroke 150ms ease;
			}
		}
	}
}

.tabs-list {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
	padding: 8px 4px;
	transition: opacity 0.2s;
	user-select: none;
	position: relative;

	&::-webkit-scrollbar {
		width: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: var(--colorNeutralStroke1);
		border-radius: 4px;
	}

	.tab-sliding-indicator {
		position: absolute;
		left: 4px;
		top: 0;
		width: 3px;
		height: 18px;
		background-color: var(--colorBrandBackground);
		border-radius: 2px;
		pointer-events: none;
		z-index: 2;
		will-change: transform;
		transition:
			transform 200ms cubic-bezier(0.2, 0.9, 0.2, 1),
			opacity 150ms ease;
	}
}

.f-tab-item.vertical {
	position: relative;
	overflow: hidden;
	height: 32px;
	min-height: 32px;
	padding: 0;
	margin: 0 0 3px 0;
	border-radius: 6px;
	cursor: pointer;
	user-select: none;
	background-color: transparent;
	border: 1px solid transparent;
	transition:
		background-color 150ms ease,
		border-color 150ms ease,
		box-shadow 150ms ease;

	/* 悬停未激活 Tab：背景加深 + 细微边框 + 微弱阴影 */
	&:hover:not(.active) {
		background-color: var(--colorNeutralBackgroundSubtleHover);
		border-color: var(--colorNeutralStroke2);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

		.tab-collapsed-layer .tab-badge {
			color: var(--colorNeutralForeground1);
		}
	}

	/* 激活态 Tab */
	&.active {
		background-color: var(
			--colorNeutralBackgroundSubtlePressed,
			rgba(0, 0, 0, 0.05)
		);
		border: 1px solid var(--colorNeutralStroke1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

		&::before,
		&::after {
			display: none !important;
		}

		.tab-collapsed-layer .tab-badge {
			color: var(--colorBrandForegroundLink, var(--colorBrandBackground));
			font-weight: 700;
		}

		&:hover {
			background-color: var(--colorNeutralBackgroundSubtleHover);
			border-color: var(
				--colorNeutralStrokeAccessible,
				var(--colorNeutralStroke1)
			);
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
		}
	}

	/* 图层 A：折叠单字徽章图层 (绝对居中，不占 flex 空间，零重排) */
	.tab-collapsed-layer {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: scale(0.7);
		pointer-events: none;
		will-change: opacity, transform;
		transition:
			opacity 90ms ease-out,
			transform 100ms ease-out;

		.tab-badge {
			font-size: 13px;
			// font-weight: 600;
			color: var(--colorNeutralForeground2);
			user-select: none;
			line-height: 1;
		}
	}

	/* 图层 B：展开标题与关闭按钮图层 */
	.tab-expanded-layer {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 0 8px;
		opacity: 1;
		transform: translateX(0);
		will-change: opacity, transform;
		transition:
			opacity 180ms cubic-bezier(0.2, 0.9, 0.2, 1) 60ms,
			transform 200ms cubic-bezier(0.2, 0.9, 0.2, 1) 60ms;

		.tab-title-wrap {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			white-space: nowrap;
			margin-right: 4px;
		}

		.tab-rename-input {
			width: 100%;
			height: 22px;
			padding: 0 4px;
			font-size: 12px;
			color: var(--colorNeutralForeground1);
			background: var(--colorNeutralBackground1);
			border: 1px solid var(--colorBrandBackground);
			border-radius: 4px;
			outline: none;
			box-shadow: 0 0 0 1px var(--colorBrandBackground);
		}

		.tab-text {
			display: block;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: 13px;
		}

		.tab-close {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			border-radius: 4px;
			color: var(--colorNeutralForeground2);
			opacity: 0;
			transition:
				opacity 150ms ease,
				background-color 150ms ease,
				color 150ms ease;

			&:hover {
				background-color: rgba(0, 0, 0, 0.08);
				color: var(--colorNeutralForeground1);
			}
		}

		&:hover .tab-close {
			opacity: 0.8;
		}

		.tab-close:hover {
			opacity: 1;
		}
	}

	&.active .tab-expanded-layer .tab-close {
		opacity: 0.8;
	}
}

.drag-container {
	display: flex;
	flex-direction: column;
	min-height: 10px;
}

.ghost-tab {
	opacity: 0.5;
	background-color: var(--colorNeutralBackgroundSubtle-alt);
	border: 1px dashed var(--colorNeutralStroke1);
}

.drag-tab {
	cursor: grabbing;
	background-color: var(--colorNeutralBackground3);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 9999;
}

.tab-flyout-card {
	position: fixed !important;
	/* 系统级层叠上下文规范：高于工作区与编辑器(50)，低于全局右键菜单与下拉面板(10000) */
	z-index: 1000 !important;
	width: 142px !important;
	height: 32px !important;
	min-height: 32px !important;
	padding: 0 8px !important;
	box-sizing: border-box !important;
	display: flex !important;
	align-items: center !important;
	border-radius: 6px !important;
	cursor: pointer !important;
	user-select: none !important;
	overflow: hidden !important;

	/* 1. 对齐 FPopoverMenu 统一亚克力材质与饱和度滤镜 (浅色 96%、深色 98% 实底) */
	background-color: var(
		--f-popover-acrylic-bg,
		var(--colorNeutralBackground3)
	) !important;
	backdrop-filter: blur(20px) saturate(125%) !important;
	-webkit-backdrop-filter: blur(20px) saturate(125%) !important;

	/* 2. 对齐 FPopoverMenu 细腻高光微描边 */
	border: 1px solid var(--colorNeutralStroke2) !important;

	/* 3. 对齐 FPopoverMenu 标准系统级双层柔和阴影 */
	box-shadow:
		0 8px 16px rgba(0, 0, 0, 0.18),
		0 0 2px rgba(0, 0, 0, 0.12) !important;
	will-change: width, box-shadow, opacity;

	/* 激活态 Tab 浮层：左侧品牌蓝指示条，文字加粗并使用品牌链接色 */
	&.active {
		border-color: var(--colorNeutralStroke2) !important;

		.tab-text {
			font-weight: 700;
			color: var(--colorBrandForegroundLink, var(--colorBrandBackground));
		}

		.flyout-indicator {
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 3px;
			height: 18px;
			background-color: var(--colorBrandBackground);
			border-radius: 0 2px 2px 0;
		}
	}

	/* 未激活态 Tab 浮层：使用浅淡边框，彻底告别过深的 #616161 */
	&.hover-inactive {
		border-color: var(--colorNeutralStroke2) !important;

		&:hover {
			border-color: var(
				--colorNeutralStroke1,
				var(--colorNeutralStroke2)
			) !important;
		}
	}

	.tab-title-wrap {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		margin-right: 4px;
		padding-left: 2px;
	}

	.tab-text {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
		color: var(--colorNeutralForeground1);
		transition:
			color 150ms ease,
			font-weight 150ms ease;
	}

	.tab-rename-input {
		width: 100%;
		height: 22px;
		padding: 0 4px;
		font-size: 12px;
		color: var(--colorNeutralForeground1);
		background: var(--colorNeutralBackground1);
		border: 1px solid var(--colorBrandBackground);
		border-radius: 4px;
		outline: none;
		box-shadow: 0 0 0 1px var(--colorBrandBackground);
	}

	.tab-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		color: var(--colorNeutralForeground2);
		opacity: 0.8;
		transition:
			opacity 150ms ease,
			background-color 150ms ease,
			color 150ms ease;

		&:hover {
			background-color: var(--colorNeutralBackgroundSubtleHover);
			color: var(--colorNeutralForeground1);
			opacity: 1;
		}
	}
}

/* 激活指示条就地滑入动效 */
.indicator-fade-enter-active,
.indicator-fade-leave-active {
	transition:
		opacity 150ms ease,
		transform 150ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.indicator-fade-enter-from,
.indicator-fade-leave-to {
	opacity: 0;
	transform: translateY(-50%) scaleY(0.4);
}

/* 横向舒展滑出过渡动画 (Smooth Flyout) */
.tab-flyout-enter-active,
.tab-flyout-leave-active {
	transition:
		width 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
		box-shadow 160ms ease,
		opacity 120ms ease;
}

.tab-flyout-enter-from,
.tab-flyout-leave-to {
	width: 40px !important;
	opacity: 0.7;
}

.tab-flyout-enter-to,
.tab-flyout-leave-from {
	width: 142px !important;
	opacity: 1;
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
	border: 1px dashed var(--colorNeutralStroke1);
	color: var(--colorNeutralForeground2);
	&:hover {
		background-color: var(--colorNeutralBackgroundSubtleHover);
		border-color: var(--colorNeutralForeground2);
		color: var(--colorNeutralForeground1);
	}
}
</style>
